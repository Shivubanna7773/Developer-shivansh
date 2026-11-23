import 'dotenv/config';
import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createSetupGuidePdf } from './src/utils/setupGuidePdf';

const PORT = Number(process.env.PORT || 3000);

const ALLOWED_CHAT_MODELS = new Set([
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-4-carbon',
  'gemini-4-neon',
]);

const ALLOWED_VOICES = new Set(['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir']);

const ROLE_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  strategist:
    'You are the Studio Pulse Lead Brand Strategist for Kora Design Atelier. Give sharp, actionable recommendations on social channel cadence, audience growth, and content positioning. Be concise, grounded in the provided studio metrics, and avoid fluff.',
  copywriter:
    'You are the Studio Pulse Senior Social Copywriter. Craft punchy hooks, platform-native captions (Instagram, YouTube, Facebook, LinkedIn, X), and clear calls to action tailored to a contemporary design & lifestyle brand.',
  analyst:
    'You are the Studio Pulse Growth & Attribution Analyst. Diagnose reach velocity, engagement rate shifts, save-to-impression ratios, and campaign conversion performance with clear quantitative reasoning.',
  campaign_architect:
    'You are the Studio Pulse Interactive Campaign Architect. Design multi-channel launch sequences, creator partnership workflows, and cross-platform content calendars with concrete timelines and deliverables.',
};

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Configure your API key in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown, model?: string): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403') || lower.includes('api key')) {
    return {
      status: 403,
      message:
        'API key error or permission denied. Please check or select your Gemini API key in the Settings > Secrets panel.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    const modelNote =
      model === 'gemini-4-carbon' || model === 'gemini-4-neon'
        ? ` Model "${model}" requires a billing-enabled API key in Settings > Secrets, or you can switch to gemini-4-hydrogen or gemini-3.1-flash-lite.`
        : ' Upgrading to a billing-enabled API key in Settings > Secrets increases your quota.';
    return {
      status: 429,
      message: `Rate limit or quota reached.${modelNote}`,
    };
  }
  if (lower.includes('404') || lower.includes('not_found') || lower.includes('not found')) {
    return {
      status: 404,
      message: `Model "${model ?? 'requested'}" was not found or is unavailable for your current key. Try gemini-4-hydrogen or gemini-3.1-flash-lite.`,
    };
  }

  return {
    status: 500,
    message: rawMessage || 'Unexpected error communicating with Gemini.',
  };
}

interface ChatTurnInput {
  role: 'user' | 'model';
  text: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Multi-turn streaming chat endpoint
  app.post('/api/chat', async (req, res) => {
    const {
      messages,
      model = 'gemini-4-hydrogen',
      roleId = 'strategist',
      workspaceContext = '',
    } = req.body as {
      messages?: ChatTurnInput[];
      model?: string;
      roleId?: string;
      workspaceContext?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const selectedModel = ALLOWED_CHAT_MODELS.has(model) ? model : 'gemini-4-hydrogen';
    const baseRole = ROLE_SYSTEM_INSTRUCTIONS[roleId] ?? ROLE_SYSTEM_INSTRUCTIONS.strategist;
    const systemInstruction = workspaceContext
      ? `${baseRole}\n\nCurrent Studio Pulse Workspace Snapshot:\n${workspaceContext}`
      : baseRole;

    const priorTurns = messages.slice(0, -1).map((m) => ({
      role: m.role === 'model' ? ('model' as const) : ('user' as const),
      parts: [{ text: String(m.text || '') }],
    }));
    const latestMessage = String(messages[messages.length - 1]?.text || '').trim();

    if (!latestMessage) {
      res.status(400).json({ error: 'Latest user message cannot be empty.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const ai = createGeminiClient();
      const chat = ai.chats.create({
        model: selectedModel,
        history: priorTurns,
        config: {
          systemInstruction,
        },
      });

      const stream = await chat.sendMessageStream({ message: latestMessage });
      for await (const chunk of stream) {
        if (chunk.text) {
          sendEvent({ type: 'chunk', text: chunk.text });
        }
      }
      sendEvent({ type: 'done', model: selectedModel });
      res.end();
    } catch (err) {
      const formatted = formatGeminiError(err, selectedModel);
      sendEvent({ type: 'error', status: formatted.status, error: formatted.message });
      res.end();
    }
  });

  // Downloadable Setup Guide PDF endpoint
  app.get('/api/setup-guide.pdf', (_req, res) => {
    try {
      const doc = createSetupGuidePdf();
      const buffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="studio-pulse-setup-guide.pdf"');
      res.send(buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate setup guide PDF.';
      res.status(500).json({ error: message });
    }
  });

  // Mount Vite middleware in dev, or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  const server = http.createServer(app);

  // WebSocket server for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (reqUrl.pathname === '/api/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request) => {
    const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const requestedVoice = reqUrl.searchParams.get('voice') || 'Zephyr';
    const voiceName = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : 'Zephyr';
    const roleId = reqUrl.searchParams.get('role') || 'strategist';
    const baseRole = ROLE_SYSTEM_INSTRUCTIONS[roleId] ?? ROLE_SYSTEM_INSTRUCTIONS.strategist;

    const sendClient = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let closedByClient = false;

    try {
      const ai = createGeminiClient();
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `${baseRole} Keep spoken responses crisp, conversational, and concise (2 to 4 sentences unless asked for deeper detail).`,
        },
        callbacks: {
          onopen: () => {
            sendClient({ type: 'ready', model: 'gemini-3.8-live', voice: voiceName });
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              sendClient({ type: 'inputTranscript', text: content.inputTranscription.text });
            }
            if (content?.outputTranscription?.text) {
              sendClient({ type: 'outputTranscript', text: content.outputTranscription.text });
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                sendClient({ type: 'audio', audio: part.inlineData.data });
              }
            }
            if (content?.interrupted) {
              sendClient({ type: 'interrupted', interrupted: true });
            }
            if (content?.turnComplete) {
              sendClient({ type: 'turnComplete' });
            }
          },
          onerror: (err: unknown) => {
            const formatted = formatGeminiError(err, 'gemini-3.8-live');
            sendClient({ type: 'error', error: formatted.message });
          },
          onclose: () => {
            if (!closedByClient) {
              sendClient({ type: 'closed' });
            }
          },
        },
      });
    } catch (err) {
      const formatted = formatGeminiError(err, 'gemini-3.8-live');
      sendClient({ type: 'error', error: formatted.message });
      clientWs.close();
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const parsed = JSON.parse(raw.toString()) as { audio?: string; text?: string };
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({ text: parsed.text });
        }
      } catch {
        // Ignore malformed incoming client frames
      }
    });

    clientWs.on('close', () => {
      closedByClient = true;
      try {
        session?.close();
      } catch {
        // Ignore close errors
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Studio Pulse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Studio Pulse server:', err);
  process.exit(1);
});

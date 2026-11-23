import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AudioLines,
  Bot,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Send,
  Volume2,
} from 'lucide-react';
import {
  AssistantRoleId,
  ChannelAccount,
  ChatModelId,
  ChatTurn,
  InboxThread,
  LiveVoiceName,
  ScheduledPost,
} from '../types/studio';

interface AssistantScreenProps {
  posts: ScheduledPost[];
  threads: InboxThread[];
  accounts: ChannelAccount[];
  chatHistory: ChatTurn[];
  onUpdateChatHistory: React.Dispatch<React.SetStateAction<ChatTurn[]>>;
  initialMode?: 'chat' | 'voice';
}

const ROLE_OPTIONS: {
  id: AssistantRoleId;
  label: string;
  description: string;
  defaultModel: ChatModelId;
}[] = [
  {
    id: 'strategist',
    label: 'Lead Brand Strategist',
    description: 'Channel cadence, audience positioning, and launch sequencing.',
    defaultModel: 'gemini-4-hydrogen',
  },
  {
    id: 'copywriter',
    label: 'Senior Copywriter',
    description: 'Fast hooks, captions, and platform-native copy variants.',
    defaultModel: 'gemini-3.1-flash-lite',
  },
  {
    id: 'analyst',
    label: 'Growth Analyst',
    description: 'Deep reasoning over attribution, saves, and velocity patterns.',
    defaultModel: 'gemini-4-carbon',
  },
  {
    id: 'campaign_architect',
    label: 'Campaign Architect',
    description: 'Complex multi-channel campaign plans and creator workflows.',
    defaultModel: 'gemini-4-neon',
  },
];

const MODEL_OPTIONS: {
  id: ChatModelId;
  label: string;
  badge: string;
  paidNote?: boolean;
}[] = [
  { id: 'gemini-4-hydrogen', label: 'gemini-4-hydrogen', badge: 'General Tasks' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite', badge: 'Fast Turnaround' },
  { id: 'gemini-4-carbon', label: 'gemini-4-carbon', badge: 'Deep Reasoning', paidNote: true },
  { id: 'gemini-4-neon', label: 'gemini-4-neon', badge: 'Complex Interactive', paidNote: true },
];

const VOICE_OPTIONS: LiveVoiceName[] = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

const STARTER_PROMPTS = [
  'Audit our current channel mix and suggest where to focus next week.',
  'Draft 3 punchy TikTok hooks for the Winter Capsule Lookbook Teaser.',
  'Recommend a response strategy for our unread Vogue Living & creator DMs.',
  'Outline a 5-day multi-channel launch cadence for Material Transparency.',
];

interface LiveTranscriptEntry {
  id: string;
  speaker: 'user' | 'model';
  text: string;
}

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.floor(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += input[j];
    }
    result[i] = sum / Math.max(1, end - start);
  }
  return result;
}

function float32ToBase64Pcm16(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(len / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  posts,
  threads,
  accounts,
  chatHistory,
  onUpdateChatHistory,
  initialMode = 'chat',
}) => {
  const [mode, setMode] = useState<'chat' | 'voice'>(initialMode);
  const [roleId, setRoleId] = useState<AssistantRoleId>('strategist');
  const [model, setModel] = useState<ChatModelId>('gemini-4-hydrogen');
  const [includeWorkspace, setIncludeWorkspace] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Live Voice states
  const [voiceName, setVoiceName] = useState<LiveVoiceName>('Zephyr');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [transcript, setTranscript] = useState<LiveTranscriptEntry[]>([]);
  const [liveTextNudge, setLiveTextNudge] = useState('');

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Refs for Live API audio & WebSocket callbacks (prevents stale closures)
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isStreaming]);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Cleanup Live session on unmount
  useEffect(() => {
    return () => {
      cleanupLiveSession();
    };
  }, []);

  const workspaceSummary = useMemo(() => {
    const channelLines = accounts
      .map(
        (a) =>
          `- ${a.name} (${a.handle}): ${a.followers.toLocaleString()} followers (+${a.followerDeltaPct}%), ${a.avgEngagement}% avg engagement`
      )
      .join('\n');
    const scheduled = posts
      .filter((p) => p.status === 'scheduled')
      .map((p) => `- "${p.title}" (${p.format}, ${p.channels.join('/')}) on ${p.scheduledDate} ${p.scheduledTime}`)
      .join('\n');
    const unread = threads
      .filter((t) => t.unread)
      .map((t) => `- ${t.contactName} (${t.channel}, ${t.category}): "${t.messages[t.messages.length - 1]?.text}"`)
      .join('\n');
    return `Channels:\n${channelLines}\n\nUpcoming Queue:\n${scheduled || 'None'}\n\nUnread Inbox:\n${unread || 'None'}`;
  }, [accounts, posts, threads]);

  const handleRoleSelect = (nextRole: AssistantRoleId) => {
    setRoleId(nextRole);
    const preset = ROLE_OPTIONS.find((r) => r.id === nextRole);
    if (preset) {
      // Keep free-tier default unless user explicitly selects a paid model
      if (preset.defaultModel === 'gemini-4-hydrogen' || preset.defaultModel === 'gemini-3.1-flash-lite') {
        setModel(preset.defaultModel);
      }
    }
  };

  const sendChatMessage = async (textToSend?: string) => {
    const cleanText = (textToSend ?? inputText).trim();
    if (!cleanText || isStreaming) return;

    setChatError(null);
    if (!textToSend) setInputText('');

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userTurn: ChatTurn = {
      id: `turn-u-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: nowLabel,
    };

    const assistantTurnId = `turn-m-${Date.now() + 1}`;
    const placeholderTurn: ChatTurn = {
      id: assistantTurnId,
      role: 'model',
      text: '',
      model,
      roleId,
      timestamp: nowLabel,
    };

    const historyForServer = [...chatHistory, userTurn].map((t) => ({
      role: t.role,
      text: t.text,
    }));

    onUpdateChatHistory((prev) => [...prev, userTurn, placeholderTurn]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForServer,
          model,
          roleId,
          workspaceContext: includeWorkspace ? workspaceSummary : '',
        }),
      });

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response body unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const line = rawEvent.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          const payload = JSON.parse(jsonStr) as {
            type?: string;
            text?: string;
            error?: string;
          };

          if (payload.type === 'chunk' && payload.text) {
            onUpdateChatHistory((prev) =>
              prev.map((item) =>
                item.id === assistantTurnId
                  ? { ...item, text: item.text + payload.text }
                  : item
              )
            );
          } else if (payload.type === 'error') {
            throw new Error(payload.error || 'Model returned an error.');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini chat service.';
      setChatError(message);
      onUpdateChatHistory((prev) =>
        prev.filter((item) => !(item.id === assistantTurnId && item.text === ''))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // --- Live Voice Functions ---
  const stopPlaybackQueue = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // Ignore already stopped sources
      }
    });
    activeSourcesRef.current.clear();
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    }
  };

  const scheduleAudioChunk = (base64: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const samples = base64Pcm16ToFloat32(base64);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
    };
  };

  const appendTranscript = (speaker: 'user' | 'model', text: string) => {
    if (!text) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: last.text + text },
        ];
      }
      return [...prev, { id: `tr-${Date.now()}-${Math.random()}`, speaker, text }];
    });
  };

  const cleanupLiveSession = () => {
    stopPlaybackQueue();
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      void inputCtxRef.current.close();
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      void outputCtxRef.current.close();
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore close errors
      }
      wsRef.current = null;
    }
    setMicLevel(0);
  };

  const startLiveSession = async () => {
    if (voiceStatus === 'connecting' || voiceStatus === 'live') return;
    setVoiceError(null);
    setVoiceStatus('connecting');
    setIsMuted(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(
        voiceName
      )}&role=${encodeURIComponent(roleId)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        // Keep processor alive without echoing mic audio to speakers
        const silentGain = inputCtx.createGain();
        silentGain.gain.value = 0;

        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(inputCtx.destination);

        processor.onaudioprocess = (event) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          if (isMutedRef.current) {
            setMicLevel(0);
            return;
          }
          const raw = event.inputBuffer.getChannelData(0);
          let peak = 0;
          for (let i = 0; i < raw.length; i += 8) {
            const abs = Math.abs(raw[i]);
            if (abs > peak) peak = abs;
          }
          setMicLevel(Math.min(1, peak * 4));

          const pcm16k = downsampleTo16k(raw, inputCtx.sampleRate);
          const base64 = float32ToBase64Pcm16(pcm16k);
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type?: string;
            audio?: string;
            text?: string;
            interrupted?: boolean;
            error?: string;
          };

          if (msg.type === 'ready') {
            setVoiceStatus('live');
          } else if (msg.type === 'audio' && msg.audio) {
            scheduleAudioChunk(msg.audio);
          } else if (msg.type === 'inputTranscript' && msg.text) {
            appendTranscript('user', msg.text);
          } else if (msg.type === 'outputTranscript' && msg.text) {
            appendTranscript('model', msg.text);
          } else if (msg.type === 'interrupted' || msg.interrupted) {
            stopPlaybackQueue();
          } else if (msg.type === 'error') {
            setVoiceError(msg.error || 'Live voice session encountered an error.');
            setVoiceStatus('error');
            cleanupLiveSession();
          } else if (msg.type === 'closed') {
            setVoiceStatus('idle');
            cleanupLiveSession();
          }
        } catch {
          // Ignore non-JSON frames
        }
      };

      ws.onerror = () => {
        setVoiceError('WebSocket connection error with Live API service.');
        setVoiceStatus('error');
        cleanupLiveSession();
      };

      ws.onclose = () => {
        setVoiceStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
        cleanupLiveSession();
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Microphone access or audio setup failed.';
      setVoiceError(message);
      setVoiceStatus('error');
      cleanupLiveSession();
    }
  };

  const endLiveSession = () => {
    cleanupLiveSession();
    setVoiceStatus('idle');
  };

  const sendLiveNudge = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = liveTextNudge.trim();
    if (!clean || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: clean }));
    appendTranscript('user', clean);
    setLiveTextNudge('');
  };

  const activeRole = ROLE_OPTIONS.find((r) => r.id === roleId) ?? ROLE_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Mode Switcher & Role Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#e2e8f0] self-start">
          <button
            type="button"
            onClick={() => setMode('chat')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'chat'
                ? 'bg-[#4648d4] text-white shadow-sm'
                : 'text-[#464554] hover:text-[#0b1c30]'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Multi-Turn Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('voice')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'voice'
                ? 'bg-[#b10e6b] text-white shadow-sm'
                : 'text-[#464554] hover:text-[#0b1c30]'
            }`}
          >
            <AudioLines className="w-3.5 h-3.5" />
            <span>Live Voice (gemini-3.8-live)</span>
          </button>
        </div>

        {/* Role Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {ROLE_OPTIONS.map((role) => {
            const active = role.id === roleId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#0b1c30] text-white'
                    : 'bg-white text-[#464554] border border-[#e2e8f0] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'chat' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Config Rail */}
          <aside className="xl:col-span-4 space-y-5">
            <section className="studio-card rounded-[2rem] p-5 space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#0b1c30]">
                  Role & System Instruction
                </h3>
                <p className="text-xs text-[#464554] mt-1 leading-relaxed">
                  {activeRole.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                <span className="block text-xs font-semibold text-[#464554]">
                  Task Model Routing
                </span>
                <div className="space-y-2">
                  {MODEL_OPTIONS.map((opt) => {
                    const selected = model === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setModel(opt.id);
                          setChatError(null);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#eff4ff] border-[#4648d4]'
                            : 'bg-white border-[#e2e8f0] hover:bg-[#f8f9ff]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0b1c30]">
                            {opt.badge}
                          </span>
                          {opt.paidNote && (
                            <span className="text-[11px] font-semibold text-[#767586]">
                              Billing key
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#464554] mt-0.5 font-mono">
                          {opt.id}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-start gap-3 pt-3 border-t border-[#e2e8f0] text-xs text-[#0b1c30] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWorkspace}
                  onChange={(e) => setIncludeWorkspace(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-[#4648d4] cursor-pointer"
                />
                <span>
                  <span className="font-semibold block">Ground in Studio Pulse data</span>
                  <span className="text-[#767586]">
                    Include live channel followers, scheduled posts, and unread inbox threads.
                  </span>
                </span>
              </label>
            </section>
          </aside>

          {/* Right Scrollable Chat Thread */}
          <section className="xl:col-span-8 studio-card rounded-[2rem] flex flex-col h-[640px] overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#eef2ff] text-[#4648d4] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold text-[#0b1c30] truncate">
                    {activeRole.label}
                  </h3>
                  <p className="text-xs text-[#767586] truncate">
                    Model: {model} · Multi-turn memory active
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdateChatHistory([]);
                  setChatError(null);
                }}
                disabled={chatHistory.length === 0 || isStreaming}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#e2e8f0] text-xs font-semibold text-[#464554] hover:bg-[#eff4ff] hover:text-[#0b1c30] disabled:opacity-45 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Thread</span>
              </button>
            </div>

            {/* Scrollable Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8f9ff]">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <h4 className="font-display text-xl font-semibold text-[#0b1c30]">
                    Ask your {activeRole.label}
                  </h4>
                  <p className="text-xs text-[#464554] mt-1.5 mb-6 leading-relaxed">
                    Start a multi-turn strategy session grounded in Kora Design Atelier’s live social channels and queue.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendChatMessage(prompt)}
                        className="text-left p-3.5 rounded-2xl bg-white border border-[#e2e8f0] text-xs font-semibold text-[#0b1c30] hover:border-[#4648d4] hover:bg-[#eff4ff]/50 transition-all cursor-pointer leading-relaxed"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((turn) => {
                  const isUser = turn.role === 'user';
                  return (
                    <div
                      key={turn.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-[#767586] mb-1 px-1">
                        <span className="font-semibold text-[#464554]">
                          {isUser ? 'You' : ROLE_OPTIONS.find((r) => r.id === turn.roleId)?.label ?? 'Studio Copilot'}
                        </span>
                        {!isUser && turn.model && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{turn.model}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{turn.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-[#4648d4] text-white rounded-br-md'
                            : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-bl-md'
                        }`}
                      >
                        {turn.text || (isStreaming ? 'Thinking...' : '')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Error Banner */}
            {chatError && (
              <div className="px-6 py-3 bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-center gap-2 border-t border-[#e2e8f0]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chatError}</span>
              </div>
            )}

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendChatMessage();
              }}
              className="p-4 border-t border-[#e2e8f0] bg-white flex items-center gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isStreaming}
                placeholder={`Message ${activeRole.label} (${model})...`}
                className="flex-1 h-12 px-5 rounded-full bg-[#f8f9ff] border border-[#cbd5e1] text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4] focus:bg-white disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-[#4648d4] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(70,72,212,0.28)] hover:bg-[#3a3cc2] disabled:opacity-45 disabled:shadow-none transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isStreaming ? 'Streaming...' : 'Send'}</span>
              </button>
            </form>
          </section>
        </div>
      ) : (
        /* Live Voice Mode (gemini-3.8-live) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Voice Control Console */}
          <section className="xl:col-span-5 studio-card rounded-[2rem] p-6 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#0b1c30]">
                  Real-Time Voice Session
                </h3>
                <p className="text-xs text-[#464554] mt-0.5">
                  Full-duplex spoken strategy via Gemini Live API (`gemini-3.8-live`).
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  voiceStatus === 'live'
                    ? 'bg-[#ecfdf5] text-[#15803d]'
                    : voiceStatus === 'connecting'
                    ? 'bg-[#eef2ff] text-[#4648d4]'
                    : voiceStatus === 'error'
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : 'bg-[#f1f5f9] text-[#464554]'
                }`}
              >
                {voiceStatus === 'live'
                  ? 'Live Audio'
                  : voiceStatus === 'connecting'
                  ? 'Connecting...'
                  : voiceStatus === 'error'
                  ? 'Session Error'
                  : 'Standby'}
              </span>
            </div>

            {/* Interactive Audio Orb */}
            <div className="py-6 flex flex-col items-center justify-center rounded-3xl bg-[#f8f9ff] border border-[#e2e8f0]">
              <div className="relative flex items-center justify-center w-32 h-32">
                <div
                  className="absolute inset-0 rounded-full bg-[#b10e6b]/15 transition-transform duration-150"
                  style={{
                    transform: `scale(${voiceStatus === 'live' ? 1 + micLevel * 0.45 : 1})`,
                  }}
                />
                <div
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                    voiceStatus === 'live'
                      ? 'bg-[#b10e6b] text-white shadow-[0_8px_24px_rgba(177,14,107,0.32)]'
                      : 'bg-white text-[#464554] border border-[#cbd5e1]'
                  }`}
                >
                  {voiceStatus === 'live' ? (
                    <Volume2 className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </div>
              </div>

              <p className="text-xs font-semibold text-[#0b1c30] mt-4">
                {voiceStatus === 'live'
                  ? isMuted
                    ? 'Microphone muted — listening paused'
                    : `Speaking with ${activeRole.label} (${voiceName})`
                  : voiceStatus === 'connecting'
                  ? 'Opening 16kHz / 24kHz audio bridge...'
                  : 'Press Start Voice Session and allow microphone access'}
              </p>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                {voiceStatus !== 'live' && voiceStatus !== 'connecting' ? (
                  <button
                    type="button"
                    onClick={() => void startLiveSession()}
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#b10e6b] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(177,14,107,0.28)] hover:brightness-95 transition-all cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Voice Session</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsMuted((prev) => !prev)}
                      className={`inline-flex items-center gap-2 h-11 px-5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isMuted
                          ? 'bg-[#0b1c30] text-white border-[#0b1c30]'
                          : 'bg-white text-[#0b1c30] border-[#cbd5e1] hover:bg-[#eff4ff]'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={endLiveSession}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#ba1a1a] text-white text-xs font-semibold hover:brightness-95 transition-all cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Session</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#464554]">
                Studio Voice Persona
              </span>
              <div className="flex flex-wrap gap-2">
                {VOICE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={voiceStatus === 'live' || voiceStatus === 'connecting'}
                    onClick={() => setVoiceName(v)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-55 ${
                      voiceName === v
                        ? 'bg-[#4648d4] text-white'
                        : 'bg-[#f8f9ff] text-[#464554] border border-[#e2e8f0] hover:bg-[#eff4ff]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#767586]">
                Select a voice before starting the live session. Interrupt anytime by speaking.
              </p>
            </div>

            {voiceError && (
              <div className="p-3.5 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{voiceError}</span>
              </div>
            )}
          </section>

          {/* Right Live Transcript Pane */}
          <section className="xl:col-span-7 studio-card rounded-[2rem] flex flex-col h-[560px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-white flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-[#0b1c30]">
                  Live Conversation Transcript
                </h3>
                <p className="text-xs text-[#767586]">
                  Real-time bidirectional speech transcription from gemini-3.8-live.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTranscript([])}
                disabled={transcript.length === 0}
                className="px-3.5 py-1.5 rounded-full border border-[#e2e8f0] text-xs font-semibold text-[#464554] hover:bg-[#eff4ff] disabled:opacity-45 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div ref={transcriptScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9ff]">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                  <p className="font-display text-base font-semibold text-[#0b1c30]">
                    Ready for live voice dialogue
                  </p>
                  <p className="text-xs text-[#464554] mt-1 leading-relaxed">
                    Start a session to talk hands-free about content hooks, campaign timing, or studio inbox replies. Spoken turns appear here automatically.
                  </p>
                </div>
              ) : (
                transcript.map((entry) => {
                  const isUser = entry.speaker === 'user';
                  return (
                    <div
                      key={entry.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[11px] font-semibold text-[#767586] mb-1 px-1">
                        {isUser ? 'You (Mic)' : `${activeRole.label} · ${voiceName}`}
                      </span>
                      <div
                        className={`max-w-[84%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#0b1c30] text-white rounded-br-md'
                            : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-bl-md'
                        }`}
                      >
                        {entry.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={sendLiveNudge}
              className="p-4 border-t border-[#e2e8f0] bg-white flex items-center gap-2.5"
            >
              <input
                type="text"
                value={liveTextNudge}
                onChange={(e) => setLiveTextNudge(e.target.value)}
                disabled={voiceStatus !== 'live'}
                placeholder={
                  voiceStatus === 'live'
                    ? 'Optionally send a text prompt into the live audio session...'
                    : 'Start a live voice session to send prompts...'
                }
                className="flex-1 h-11 px-4 rounded-full bg-[#f8f9ff] border border-[#cbd5e1] text-xs text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#b10e6b]/25 focus:border-[#b10e6b] disabled:opacity-55"
              />
              <button
                type="submit"
                disabled={voiceStatus !== 'live' || !liveTextNudge.trim()}
                className="px-4 h-11 rounded-full bg-[#0b1c30] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-45 cursor-pointer whitespace-nowrap"
              >
                Send Prompt
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

import { jsPDF } from 'jspdf';

interface PdfColors {
  indigo: [number, number, number];
  rose: [number, number, number];
  cyan: [number, number, number];
  ink: [number, number, number];
  muted: [number, number, number];
  surfaceLow: [number, number, number];
  border: [number, number, number];
  white: [number, number, number];
}

const COLORS: PdfColors = {
  indigo: [70, 72, 212],
  rose: [177, 14, 107],
  cyan: [0, 104, 122],
  ink: [11, 28, 48],
  muted: [70, 69, 84],
  surfaceLow: [239, 244, 255],
  border: [226, 232, 240],
  white: [255, 255, 255],
};

export function createSetupGuidePdf(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 612
  const pageHeight = doc.internal.pageSize.getHeight(); // 792
  const margin = 48;
  const contentWidth = pageWidth - margin * 2; // 516
  const bottomLimit = pageHeight - 56;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = margin;
    }
  };

  const addSectionHeader = (indexLabel: string, title: string) => {
    ensureSpace(48);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.indigo);
    doc.text(indexLabel.toUpperCase(), margin, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...COLORS.ink);
    doc.text(title, margin, y);
    y += 8;

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.75);
    doc.line(margin, y, margin + contentWidth, y);
    y += 16;
  };

  const addParagraph = (text: string, spacingAfter = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.muted);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    const blockHeight = lines.length * 14.5;
    ensureSpace(blockHeight + spacingAfter);
    doc.text(lines, margin, y);
    y += blockHeight + spacingAfter;
  };

  const addBullet = (lead: string, detail: string) => {
    const full = `${lead}: ${detail}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(full, contentWidth - 16) as string[];
    const blockHeight = lines.length * 14;
    ensureSpace(blockHeight + 6);

    doc.setFillColor(...COLORS.indigo);
    doc.circle(margin + 4, y - 3.5, 2, 'F');

    // Bold lead on first line if it fits cleanly
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.ink);
    const leadText = `${lead}: `;
    const leadWidth = doc.getTextWidth(leadText);

    if (leadWidth < contentWidth * 0.48) {
      doc.text(leadText, margin + 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.muted);
      const restFirstLineWidth = contentWidth - 14 - leadWidth;
      const wrappedRest = doc.splitTextToSize(detail, restFirstLineWidth) as string[];
      if (wrappedRest.length > 0) {
        doc.text(wrappedRest[0], margin + 14 + leadWidth, y);
        const remainingText = wrappedRest.slice(1).join(' ');
        if (remainingText) {
          const remainingLines = doc.splitTextToSize(remainingText, contentWidth - 14) as string[];
          for (let i = 0; i < remainingLines.length; i++) {
            y += 14;
            ensureSpace(16);
            doc.text(remainingLines[i], margin + 14, y);
          }
        }
      }
      y += 18;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.muted);
      doc.text(lines, margin + 14, y);
      y += blockHeight + 5;
    }
  };

  const addCodeBlock = (lines: string[]) => {
    const lineHeight = 13.5;
    const padY = 12;
    const height = lines.length * lineHeight + padY * 2;
    ensureSpace(height + 12);

    doc.setFillColor(...COLORS.surfaceLow);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.75);
    doc.roundedRect(margin, y, contentWidth, height, 8, 8, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.ink);

    let codeY = y + padY + 9;
    for (const line of lines) {
      doc.text(line, margin + 14, codeY);
      codeY += lineHeight;
    }

    y += height + 12;
  };

  const addTable = (headers: string[], rows: string[][], colWidths: number[]) => {
    const rowHeight = 24;
    ensureSpace(rowHeight * (rows.length + 1) + 14);

    // Header row
    doc.setFillColor(...COLORS.ink);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.white);

    let x = margin + 10;
    headers.forEach((h, i) => {
      doc.text(h, x, y + 15.5);
      x += colWidths[i];
    });
    y += rowHeight;

    rows.forEach((row, rIdx) => {
      ensureSpace(rowHeight + 4);
      if (rIdx % 2 === 0) {
        doc.setFillColor(248, 249, 255);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.ink);
      let cellX = margin + 10;
      row.forEach((cell, cIdx) => {
        if (cIdx === 0) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        const truncated = doc.splitTextToSize(cell, colWidths[cIdx] - 14) as string[];
        doc.text(truncated[0] ?? '', cellX, y + 15.5);
        cellX += colWidths[cIdx];
      });
      y += rowHeight;
    });

    y += 14;
  };

  // --- Cover / Top Banner ---
  doc.setFillColor(...COLORS.indigo);
  doc.roundedRect(margin, y, contentWidth, 96, 14, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 224, 255);
  doc.text('STUDIO PULSE  ·  TECHNICAL & OPERATOR SETUP GUIDE', margin + 22, y + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.text('Studio Pulse Setup & Operations Manual', margin + 22, y + 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(235, 238, 255);
  doc.text(
    'Full-stack React, Express, WebSocket Live Audio & Gemini Strategy Workspace',
    margin + 22,
    y + 76
  );
  y += 118;

  // Section 1: Overview
  addSectionHeader('01. Architecture', 'System Overview & Requirements');
  addParagraph(
    'Studio Pulse combines a Vite + React 19 single-page workspace with a unified Express and WebSocket server (server.ts) running on port 3000. All Gemini API requests and Live API audio streams run exclusively on the server so your API key remains protected in environment secrets.'
  );
  addBullet('Node.js Runtime', 'Node.js v20+ (v22 recommended) with npm installed.');
  addBullet('Frontend Stack', 'React 19, TypeScript, Tailwind CSS v4, Lucide icons, and jsPDF.');
  addBullet('Backend Stack', 'Express 4, tsx, ws (WebSocket bridge), and @google/genai (^3.6.1).');
  addBullet('Client Persistence', 'Scheduled posts, inbox threads, preferences, and chat history persist in localStorage.');

  // Section 2: Installation
  addSectionHeader('02. Local Installation', 'Installing Dependencies & Running Locally');
  addParagraph(
    'Clone or open the project directory, install all npm dependencies, and launch the unified development server. Express mounts Vite middleware automatically when NODE_ENV is not production.'
  );
  addCodeBlock([
    '# 1. Install runtime and development dependencies',
    'npm install',
    '',
    '# 2. Configure environment variables (see Section 03)',
    'cp .env.example .env',
    '',
    '# 3. Start the Express + Vite + WebSocket server on port 3000',
    'npm run dev',
  ]);

  addTable(
    ['Command', 'Action', 'When to Use'],
    [
      ['npm run dev', 'Starts tsx server.ts on port 3000', 'Local development & preview'],
      ['npm run lint', 'Runs TypeScript check (tsc --noEmit)', 'Verify types before commit'],
      ['npm run build', 'Compiles frontend bundle to dist/', 'Prepare production assets'],
      ['npm start', 'Runs node server.ts serving dist/', 'Production deployment'],
    ],
    [130, 210, 176]
  );

  // Section 3: Environment & API Keys
  addSectionHeader('03. Environment & Gemini Keys', 'Configuring Secrets & Model Access');
  addParagraph(
    'Studio Pulse reads GEMINI_API_KEY and APP_URL from environment variables on the server. In Google AI Studio, configure keys through the Settings > Secrets panel rather than hardcoding secrets into source files.'
  );
  addCodeBlock([
    '# .env configuration',
    'GEMINI_API_KEY="YOUR_GEMINI_API_KEY"',
    'APP_URL="http://localhost:3000"',
    'PORT=3000',
  ]);
  addTable(
    ['Model ID', 'Endpoint', 'Intended Workload & Tier'],
    [
      ['gemini-4-hydrogen', 'POST /api/chat', 'General strategy & default chat (Standard key)'],
      ['gemini-3.1-flash-lite', 'POST /api/chat', 'Fast hooks, captions & quick drafts (Standard key)'],
      ['gemini-4-carbon', 'POST /api/chat', 'Deep analytical reasoning (Requires billing key)'],
      ['gemini-4-neon', 'POST /api/chat', 'Complex interactive campaigns (Requires billing key)'],
      ['gemini-3.8-live', 'WS /api/live', 'Real-time 16kHz/24kHz voice sessions (Standard key)'],
    ],
    [140, 105, 271]
  );

  // Section 4: Feature Configuration
  addSectionHeader('04. Workspace Features', 'Configuring Growth Pulse, Queue, Inbox & Copilot');
  addBullet(
    'Dashboard & Velocity Chart',
    'Filter all KPI cards, charts, and active campaigns by channel (Instagram, YouTube, Facebook, LinkedIn, X) and time window (7, 30, or 90 days).'
  );
  addBullet(
    'Growth Pulse Alerts',
    'Monitors published posts against preferences.growthPulseThreshold (default 7.5%). Adjust the threshold in Channels & Settings or via the Dashboard +/- steppers to trigger floating alert toasts.'
  );
  addBullet(
    'Content Queue & Composer',
    'Switch between Stream and Week Grid views, compose or edit multi-channel posts with live artwork previews, and publish immediately to record metrics.'
  );
  addBullet(
    'Unified Inbox',
    'Filter DMs, comments, and press inquiries by channel or unread state, assign strategists, apply quick templates, and send replies.'
  );
  addBullet(
    'Analytics & CSV Export',
    'Inspect peak engagement hour heatmaps, format efficiency bars, and sortable leaderboards, or click Export CSV for spreadsheet reporting.'
  );
  addBullet(
    'Studio Copilot & Live Voice',
    'Switch between Multi-Turn Chat (with workspace data grounding and 4 strategist personas) and Live Voice (gemini-3.8-live) with 5 studio voices and live dual-sided transcription.'
  );

  // Section 5: Troubleshooting
  addSectionHeader('05. Troubleshooting', 'Common Setup Issues & Resolutions');
  addBullet(
    '403 Permission Denied / Invalid Key',
    'Confirm GEMINI_API_KEY is set in your .env file or AI Studio Settings > Secrets panel, then restart the server.'
  );
  addBullet(
    '429 Quota or Paid Model Error',
    'gemini-4-carbon and gemini-4-neon require a billing-enabled API key in Settings > Secrets. Switch to gemini-4-hydrogen or gemini-3.1-flash-lite for standard keys.'
  );
  addBullet(
    'Live Voice Microphone Blocked',
    'Allow browser microphone permissions for localhost or your HTTPS Cloud Run URL. Live Voice streams 16kHz PCM audio upstream and plays 24kHz PCM responses.'
  );
  addBullet(
    'Resetting Local Workspace State',
    'Open Channels & Settings and click Restore Initial Studio Data to reset posts, threads, chat history, and Growth Pulse defaults.'
  );

  // Footer page numbering on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 40, margin + contentWidth, pageHeight - 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.muted);
    doc.text('Studio Pulse · Setup & Operations Guide', margin, pageHeight - 25);
    doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth, pageHeight - 25, {
      align: 'right',
    });
  }

  return doc;
}

export function downloadSetupGuidePdf(): void {
  const doc = createSetupGuidePdf();
  doc.save('studio-pulse-setup-guide.pdf');
}

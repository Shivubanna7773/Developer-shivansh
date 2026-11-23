import React from 'react';
import { ChannelId } from '../types/studio';
import { CHANNEL_META } from '../data/seedData';

export const ChannelGlyph: React.FC<{ channel: ChannelId; className?: string }> = ({
  channel,
  className = 'w-3.5 h-3.5',
}) => {
  switch (channel) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="4" />
          <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      );
  }
};

export const ChannelInlineText: React.FC<{ channel: ChannelId }> = ({ channel }) => {
  const meta = CHANNEL_META[channel];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
      style={{ color: meta.textColor }}
    >
      <ChannelGlyph channel={channel} className="w-3.5 h-3.5" />
      <span>{meta.label}</span>
    </span>
  );
};

export const ChannelPillButton: React.FC<{
  channel: ChannelId | 'all';
  selected: boolean;
  onClick: () => void;
}> = ({ channel, selected, onClick }) => {
  if (channel === 'all') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4648d4] ${
          selected
            ? 'bg-[#0b1c30] text-white shadow-sm'
            : 'bg-white text-[#464554] border border-[#e2e8f0] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
        }`}
      >
        All Channels
      </button>
    );
  }

  const meta = CHANNEL_META[channel];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4648d4] ${
        selected
          ? 'bg-[#0b1c30] text-white shadow-sm'
          : 'border border-transparent hover:brightness-95'
      }`}
      style={
        selected
          ? undefined
          : {
              backgroundColor: meta.washBg,
              color: meta.textColor,
            }
      }
    >
      <ChannelGlyph channel={channel} className="w-3.5 h-3.5" />
      <span>{meta.label}</span>
    </button>
  );
};

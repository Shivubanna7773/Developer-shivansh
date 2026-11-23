import React from 'react';
import { ArtworkVariant } from '../types/studio';

interface PostArtworkProps {
  variant: ArtworkVariant;
  className?: string;
}

export const PostArtwork: React.FC<PostArtworkProps> = ({ variant, className = '' }) => {
  switch (variant) {
    case 'atelier-drop':
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eff4ff] via-[#e1e0ff] to-[#ffd9e4] ${className}`}
        >
          <svg viewBox="0 0 240 160" className="w-full h-full object-cover" aria-hidden="true">
            <defs>
              <linearGradient id="dropGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4648d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d23284" stopOpacity="0.75" />
              </linearGradient>
            </defs>
            <circle cx="176" cy="46" r="56" fill="#ffffff" fillOpacity="0.45" />
            <rect x="28" y="34" width="96" height="96" rx="28" fill="url(#dropGrad)" />
            <circle cx="144" cy="108" r="32" fill="#06b6d4" fillOpacity="0.4" />
            <path d="M52 82h48M76 58v48" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'packaging-film':
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ecfeff] via-[#dce9ff] to-[#f8f9ff] ${className}`}
        >
          <svg viewBox="0 0 240 160" className="w-full h-full object-cover" aria-hidden="true">
            <rect x="44" y="28" width="152" height="104" rx="22" fill="#ffffff" fillOpacity="0.82" stroke="#c7c4d7" strokeWidth="1.5" />
            <rect x="64" y="48" width="52" height="64" rx="14" fill="#00687a" fillOpacity="0.88" />
            <rect x="128" y="48" width="48" height="28" rx="10" fill="#4648d4" fillOpacity="0.22" />
            <rect x="128" y="84" width="48" height="28" rx="10" fill="#06b6d4" fillOpacity="0.35" />
          </svg>
        </div>
      );
    case 'studio-walkthrough':
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c30] via-[#213145] to-[#004e5c] ${className}`}
        >
          <svg viewBox="0 0 240 160" className="w-full h-full object-cover" aria-hidden="true">
            <circle cx="120" cy="80" r="46" fill="#4cd7f6" fillOpacity="0.18" />
            <circle cx="120" cy="80" r="28" fill="#57dffe" fillOpacity="0.28" stroke="#acedff" strokeWidth="1.5" />
            <polygon points="113,67 136,80 113,93" fill="#ffffff" />
            <rect x="24" y="24" width="48" height="12" rx="6" fill="#ffffff" fillOpacity="0.18" />
          </svg>
        </div>
      );
    case 'founder-memo':
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8f9ff] via-[#eff4ff] to-[#e1e0ff] ${className}`}
        >
          <svg viewBox="0 0 240 160" className="w-full h-full object-cover" aria-hidden="true">
            <rect x="34" y="26" width="172" height="108" rx="20" fill="#ffffff" stroke="#c7c4d7" strokeWidth="1.5" />
            <rect x="54" y="46" width="76" height="10" rx="5" fill="#4648d4" />
            <rect x="54" y="68" width="132" height="7" rx="3.5" fill="#cbd5e1" />
            <rect x="54" y="84" width="118" height="7" rx="3.5" fill="#cbd5e1" />
            <rect x="54" y="100" width="92" height="7" rx="3.5" fill="#e2e8f0" />
          </svg>
        </div>
      );
    case 'material-study':
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fdf2f8] via-[#f8f9ff] to-[#dce9ff] ${className}`}
        >
          <svg viewBox="0 0 240 160" className="w-full h-full object-cover" aria-hidden="true">
            <path d="M0 120 Q60 60 120 100 T240 60 L240 160 L0 160 Z" fill="#4648d4" fillOpacity="0.18" />
            <path d="M0 135 Q80 85 160 115 T240 90 L240 160 L0 160 Z" fill="#d23284" fillOpacity="0.22" />
            <circle cx="72" cy="54" r="22" fill="#b10e6b" fillOpacity="0.78" />
            <circle cx="114" cy="64" r="14" fill="#06b6d4" fillOpacity="0.7" />
          </svg>
        </div>
      );
    case 'campaign-launch':
      return (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef2ff] via-[#acedff]/45 to-[#ffd9e4]/60 ${className}`}
        >
          <svg viewBox="0 0 240 160" className="w-full h-full object-cover" aria-hidden="true">
            <rect x="30" y="38" width="52" height="84" rx="16" fill="#4648d4" fillOpacity="0.88" />
            <rect x="94" y="24" width="52" height="98" rx="16" fill="#00687a" fillOpacity="0.82" />
            <rect x="158" y="48" width="52" height="74" rx="16" fill="#d23284" fillOpacity="0.84" />
          </svg>
        </div>
      );
  }
};

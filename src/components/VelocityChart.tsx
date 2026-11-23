import React, { useMemo, useState } from 'react';
import { ChannelId, VelocityPoint } from '../types/studio';
import { CHANNEL_META } from '../data/seedData';

interface VelocityChartProps {
  data: VelocityPoint[];
  activeChannel: ChannelId | 'all';
}

const CHANNELS: ChannelId[] = ['youtube', 'instagram', 'facebook', 'linkedin', 'x'];

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data, activeChannel }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [visibleChannels, setVisibleChannels] = useState<Record<ChannelId, boolean>>({
    instagram: true,
    youtube: true,
    facebook: true,
    linkedin: true,
    x: true,
  });

  const shownChannels = useMemo(() => {
    if (activeChannel !== 'all') return [activeChannel];
    return CHANNELS.filter((ch) => visibleChannels[ch]);
  }, [activeChannel, visibleChannels]);

  const width = 760;
  const height = 270;
  const padLeft = 52;
  const padRight = 22;
  const padTop = 22;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxValue = useMemo(() => {
    let max = 10000;
    for (const pt of data) {
      for (const ch of shownChannels) {
        if (pt[ch] > max) max = pt[ch];
      }
    }
    return Math.ceil((max * 1.14) / 10000) * 10000;
  }, [data, shownChannels]);

  const xFor = (idx: number) => {
    if (data.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (data.length - 1)) * plotW;
  };

  const yFor = (val: number) => {
    return padTop + plotH - (val / maxValue) * plotH;
  };

  const buildSmoothPath = (channel: ChannelId) => {
    const pts = data.map((d, i) => ({ x: xFor(i), y: yFor(d[channel]) }));
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const buildAreaPath = (channel: ChannelId) => {
    const line = buildSmoothPath(channel);
    if (!line || data.length === 0) return '';
    const lastX = xFor(data.length - 1);
    const firstX = xFor(0);
    const baseY = padTop + plotH;
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const toggleChannel = (ch: ChannelId) => {
    setVisibleChannels((prev) => {
      const next = { ...prev, [ch]: !prev[ch] };
      // Prevent hiding all channels simultaneously
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));
  const activePoint = hoverIdx !== null ? data[hoverIdx] : data[data.length - 1];

  return (
    <div>
      {/* Series Legend Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {CHANNELS.map((ch) => {
            const meta = CHANNEL_META[ch];
            const isActive = activeChannel === 'all' ? visibleChannels[ch] : activeChannel === ch;
            const disabled = activeChannel !== 'all';
            return (
              <button
                key={ch}
                type="button"
                disabled={disabled}
                onClick={() => toggleChannel(ch)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 ${
                  disabled ? 'cursor-default' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'bg-[#eff4ff] text-[#0b1c30] border border-[#c7c4d7]'
                    : 'bg-white text-[#767586] border border-[#e2e8f0] opacity-60 hover:opacity-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.accentHex }}
                />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Readout Summary */}
        {activePoint && (
          <div className="flex items-center gap-3 text-xs text-[#464554] tabular-nums">
            <span className="font-semibold text-[#0b1c30]">{activePoint.label}</span>
            {shownChannels.map((ch) => (
              <span key={ch} className="inline-flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: CHANNEL_META[ch].accentHex }}
                />
                <span className="font-semibold text-[#0b1c30]">
                  {formatCompact(activePoint[ch])}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          role="img"
          aria-label="Multi-channel reach velocity chart"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            {CHANNELS.map((ch) => (
              <linearGradient key={ch} id={`area-${ch}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHANNEL_META[ch].accentHex} stopOpacity="0.18" />
                <stop offset="100%" stopColor={CHANNEL_META[ch].accentHex} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#767586] text-[11px] font-medium tabular-nums"
                >
                  {formatCompact(tick)}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {shownChannels.map((ch) => (
            <path key={`fill-${ch}`} d={buildAreaPath(ch)} fill={`url(#area-${ch})`} />
          ))}

          {/* Smooth Lines */}
          {shownChannels.map((ch) => (
            <path
              key={`line-${ch}`}
              d={buildSmoothPath(ch)}
              fill="none"
              stroke={CHANNEL_META[ch].accentHex}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Hover Vertical Rule */}
          {hoverIdx !== null && (
            <line
              x1={xFor(hoverIdx)}
              y1={padTop}
              x2={xFor(hoverIdx)}
              y2={padTop + plotH}
              stroke="#4648d4"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points & X-Axis Labels */}
          {data.map((pt, i) => {
            const x = xFor(i);
            const isHovered = hoverIdx === i;
            return (
              <g key={pt.label}>
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold ${
                    isHovered ? 'fill-[#4648d4]' : 'fill-[#767586]'
                  }`}
                >
                  {pt.label}
                </text>
                {shownChannels.map((ch) => {
                  const y = yFor(pt[ch]);
                  return (
                    <circle
                      key={`${pt.label}-${ch}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill="#ffffff"
                      stroke={CHANNEL_META[ch].accentHex}
                      strokeWidth={isHovered ? 2.5 : 2}
                    />
                  );
                })}
                {/* Invisible generous hover target column */}
                <rect
                  x={x - plotW / Math.max(data.length, 2) / 2}
                  y={padTop}
                  width={plotW / Math.max(data.length, 2)}
                  height={plotH + 24}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

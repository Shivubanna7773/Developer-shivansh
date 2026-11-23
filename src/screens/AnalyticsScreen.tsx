import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download } from 'lucide-react';
import { ChannelAccount, ChannelId, ScheduledPost, TimeWindow } from '../types/studio';
import { CHANNEL_META, HEATMAP_PEAK_HOURS, HEATMAP_SLOT_LABELS } from '../data/seedData';
import { ChannelInlineText } from '../components/ChannelBadge';

interface AnalyticsScreenProps {
  accounts: ChannelAccount[];
  posts: ScheduledPost[];
  timeWindow: TimeWindow;
  onChangeTimeWindow: (w: TimeWindow) => void;
}

type SortKey = 'reach' | 'engagementRate' | 'clicks' | 'saves';

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  accounts,
  posts,
  timeWindow,
  onChangeTimeWindow,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortAsc, setSortAsc] = useState(false);

  const publishedRows = useMemo(() => {
    const list = posts.filter((p) => p.status === 'published' && p.metrics);
    return [...list].sort((a, b) => {
      const av = a.metrics?.[sortKey] ?? 0;
      const bv = b.metrics?.[sortKey] ?? 0;
      return sortAsc ? av - bv : bv - av;
    });
  }, [posts, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Title', 'Format', 'Campaign', 'Date', 'Channels', 'Reach', 'Engagement %', 'Clicks', 'Saves'];
    const rows = publishedRows.map((p) => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.format,
      `"${p.campaign}"`,
      p.scheduledDate,
      `"${p.channels.join(', ')}"`,
      p.metrics?.reach ?? 0,
      p.metrics?.engagementRate ?? 0,
      p.metrics?.clicks ?? 0,
      p.metrics?.saves ?? 0,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studio-pulse-analytics-${timeWindow}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const maxFollowers = Math.max(...accounts.map((a) => a.followers), 1);

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#e2e8f0]">
          {(['7d', '30d', '90d'] as TimeWindow[]).map((win) => (
            <button
              key={win}
              type="button"
              onClick={() => onChangeTimeWindow(win)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                timeWindow === win ? 'bg-[#4648d4] text-white' : 'text-[#464554] hover:text-[#0b1c30]'
              }`}
            >
              {win === '7d' ? '7 Days' : win === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[#4648d4] text-[#4648d4] text-xs font-semibold hover:bg-[#eff4ff] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Channel Diagnostic Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const meta = CHANNEL_META[acc.id as ChannelId];
          const pct = Math.round((acc.followers / maxFollowers) * 100);
          return (
            <div key={acc.id} className="studio-card rounded-[2rem] p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <ChannelInlineText channel={acc.id} />
                <span className="text-xs font-bold text-[#15803d] tabular-nums">
                  +{acc.followerDeltaPct}%
                </span>
              </div>

              <div>
                <p className="font-display text-[28px] leading-[34px] font-bold text-[#0b1c30] tabular-nums">
                  {(acc.followers / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-[#767586] mt-0.5">
                  {acc.handle} · {acc.avgEngagement}% avg eng.
                </p>
              </div>

              <div className="w-full h-2 rounded-full bg-[#eff4ff] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: meta.accentHex }}
                />
              </div>

              <p className="text-[11px] font-semibold text-[#464554] tabular-nums">
                Peak slot: {acc.optimalWindow}
              </p>
            </div>
          );
        })}
      </section>

      {/* Peak Engagement Heatmap + Audience Share */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 studio-card rounded-[2rem] p-6">
          <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
            Audience Engagement Windows
          </h2>
          <p className="text-xs text-[#464554] mt-0.5 mb-5">
            Relative interaction index by weekday and PST release block (0–100 scale).
          </p>

          <div className="space-y-2.5">
            <div className="grid grid-cols-7 gap-2 text-[11px] font-bold text-[#767586] text-center">
              <span className="text-left">Day</span>
              {HEATMAP_SLOT_LABELS.map((slot) => (
                <span key={slot}>{slot}</span>
              ))}
            </div>

            {HEATMAP_PEAK_HOURS.map((row) => (
              <div key={row.day} className="grid grid-cols-7 gap-2 items-center">
                <span className="text-xs font-semibold text-[#0b1c30]">{row.day}</span>
                {row.slots.map((score, idx) => {
                  const bg =
                    score >= 80
                      ? 'bg-[#4648d4] text-white'
                      : score >= 65
                      ? 'bg-[#6366f1]/75 text-white'
                      : score >= 45
                      ? 'bg-[#c0c1ff]/65 text-[#0b1c30]'
                      : 'bg-[#eff4ff] text-[#464554]';
                  return (
                    <div
                      key={idx}
                      className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums ${bg}`}
                    >
                      {score}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* Format Efficiency Breakdown */}
        <section className="xl:col-span-5 studio-card rounded-[2rem] p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
              Format Efficiency
            </h2>
            <p className="text-xs text-[#464554] mt-0.5 mb-5">
              Average save-to-impression ratio across content formats.
            </p>

            <div className="space-y-4">
              {[
                { format: 'Short Video', score: 86, rate: '6.8%', color: '#06B6D4' },
                { format: 'Carousel', score: 74, rate: '5.4%', color: '#4648d4' },
                { format: 'Reel', score: 69, rate: '5.1%', color: '#EC4899' },
                { format: 'Thread', score: 52, rate: '3.6%', color: '#334155' },
              ].map((item) => (
                <div key={item.format} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#0b1c30]">{item.format}</span>
                    <span className="text-[#464554] tabular-nums">{item.rate} eng.</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#eff4ff] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.score}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#e2e8f0] text-xs text-[#464554]">
            Short-form studio process clips currently convert 1.9x more profile visits than static announcements.
          </div>
        </section>
      </div>

      {/* Post Leaderboard Table */}
      <section className="studio-card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
              Release Performance Leaderboard
            </h2>
            <p className="text-xs text-[#464554] mt-0.5">
              Click any metric column header to re-rank published studio releases.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[11px] font-bold text-[#767586] uppercase tracking-wider">
                <th className="pb-3 pr-4">Post Title</th>
                <th className="pb-3 px-3">Channels</th>
                <th className="pb-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('reach')}
                    className="inline-flex items-center gap-1 hover:text-[#0b1c30] cursor-pointer"
                  >
                    <span>Reach</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="pb-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('engagementRate')}
                    className="inline-flex items-center gap-1 hover:text-[#0b1c30] cursor-pointer"
                  >
                    <span>Eng. Rate</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="pb-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('clicks')}
                    className="inline-flex items-center gap-1 hover:text-[#0b1c30] cursor-pointer"
                  >
                    <span>Clicks</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="pb-3 pl-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('saves')}
                    className="inline-flex items-center gap-1 hover:text-[#0b1c30] cursor-pointer"
                  >
                    <span>Saves</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/70">
              {publishedRows.map((post) => (
                <tr key={post.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3.5 pr-4">
                    <p className="text-sm font-semibold text-[#0b1c30]">{post.title}</p>
                    <p className="text-xs text-[#767586]">
                      {post.format} · {post.scheduledDate}
                    </p>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-2">
                      {post.channels.map((ch) => (
                        <ChannelInlineText key={ch} channel={ch} />
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right text-sm font-semibold text-[#0b1c30] tabular-nums">
                    {(post.metrics?.reach ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right text-sm font-semibold text-[#00687a] tabular-nums">
                    {post.metrics?.engagementRate.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 text-right text-sm font-semibold text-[#0b1c30] tabular-nums">
                    {(post.metrics?.clicks ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 pl-3 text-right text-sm font-semibold text-[#0b1c30] tabular-nums">
                    {(post.metrics?.saves ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

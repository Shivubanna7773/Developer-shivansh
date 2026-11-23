import React from 'react';
import { ArrowUpRight, TrendingUp, X } from 'lucide-react';
import { ScheduledPost } from '../types/studio';
import { ChannelInlineText } from './ChannelBadge';

export interface GrowthPulseAlert {
  key: string;
  post: ScheduledPost;
  engagementRate: number;
  threshold: number;
}

interface GrowthPulseToastProps {
  alerts: GrowthPulseAlert[];
  onDismissCurrent: () => void;
  onDismissAll: () => void;
  onInspectPost: (post: ScheduledPost) => void;
}

export const GrowthPulseToast: React.FC<GrowthPulseToastProps> = ({
  alerts,
  onDismissCurrent,
  onDismissAll,
  onInspectPost,
}) => {
  if (alerts.length === 0) return null;

  const current = alerts[0];
  const deltaPts = (current.engagementRate - current.threshold).toFixed(1);

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Growth Pulse engagement alert"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-[min(92vw,390px)] studio-dock rounded-3xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#fdf2f8] text-[#b10e6b] flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#b10e6b]">
              Growth Pulse Alert
            </span>
            <button
              type="button"
              onClick={onDismissCurrent}
              aria-label="Dismiss Growth Pulse alert"
              className="w-6 h-6 rounded-full flex items-center justify-center text-[#767586] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="font-display text-sm font-semibold text-[#0b1c30] mt-0.5 truncate">
            {current.post.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#464554] tabular-nums">
            <span className="font-display text-base font-bold text-[#0b1c30]">
              {current.engagementRate.toFixed(1)}%
            </span>
            <span>engagement</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#15803d]">
              +{deltaPts} pts above {current.threshold.toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {current.post.channels.map((ch) => (
              <ChannelInlineText key={ch} channel={ch} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => {
                onInspectPost(current.post);
                onDismissCurrent();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4648d4] text-white text-xs font-semibold hover:bg-[#3a3cc2] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Inspect Post</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              {alerts.length > 1 && (
                <button
                  type="button"
                  onClick={onDismissAll}
                  className="text-[11px] font-semibold text-[#767586] hover:text-[#0b1c30] cursor-pointer whitespace-nowrap"
                >
                  Clear all ({alerts.length})
                </button>
              )}
              <button
                type="button"
                onClick={onDismissCurrent}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#464554] hover:bg-[#eff4ff] transition-colors cursor-pointer whitespace-nowrap"
              >
                {alerts.length > 1 ? 'Next' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

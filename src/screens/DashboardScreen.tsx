import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  BellRing,
  Calendar,
  ChevronRight,
  MessageSquare,
  Minus,
  Plus,
  TrendingUp,
} from 'lucide-react';
import {
  CampaignSummary,
  ChannelAccount,
  ChannelId,
  InboxThread,
  ScheduledPost,
  ScreenId,
  StudioPreferences,
  TimeWindow,
} from '../types/studio';
import { CHANNEL_META, VELOCITY_SERIES } from '../data/seedData';
import { ChannelInlineText, ChannelPillButton } from '../components/ChannelBadge';
import { VelocityChart } from '../components/VelocityChart';
import { PostArtwork } from '../components/PostArtwork';

interface DashboardScreenProps {
  posts: ScheduledPost[];
  threads: InboxThread[];
  accounts: ChannelAccount[];
  campaigns: CampaignSummary[];
  preferences: StudioPreferences;
  onUpdatePreferences: (patch: Partial<StudioPreferences>) => void;
  timeWindow: TimeWindow;
  onChangeTimeWindow: (w: TimeWindow) => void;
  channelFilter: ChannelId | 'all';
  onChangeChannelFilter: (c: ChannelId | 'all') => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenThread: (threadId: string) => void;
  onEditPost: (post: ScheduledPost) => void;
  onNewPost: () => void;
}

const TIME_WINDOWS: { id: TimeWindow; label: string }[] = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
];

const CHANNELS: (ChannelId | 'all')[] = ['all', 'instagram', 'youtube', 'facebook', 'linkedin', 'x'];

function formatMetricNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  posts,
  threads,
  accounts,
  campaigns,
  preferences,
  onUpdatePreferences,
  timeWindow,
  onChangeTimeWindow,
  channelFilter,
  onChangeChannelFilter,
  onNavigate,
  onOpenThread,
  onEditPost,
  onNewPost,
}) => {
  const series = VELOCITY_SERIES[timeWindow];

  const kpis = useMemo(() => {
    const totalReach = series.reduce((sum, pt) => {
      if (channelFilter === 'all') {
        return sum + pt.instagram + pt.youtube + pt.facebook + pt.linkedin + pt.x;
      }
      return sum + pt[channelFilter];
    }, 0);

    const activeAccounts =
      channelFilter === 'all'
        ? accounts
        : accounts.filter((a) => a.id === channelFilter);

    const avgEngagement =
      activeAccounts.reduce((s, a) => s + a.avgEngagement, 0) /
      Math.max(activeAccounts.length, 1);

    const windowScale = timeWindow === '7d' ? 1 : timeWindow === '30d' ? 3.8 : 10.6;
    const netGrowth = Math.round(
      activeAccounts.reduce((s, a) => s + (a.followers * (a.followerDeltaPct / 100)) * 0.14 * windowScale, 0)
    );

    const baseClicks =
      channelFilter === 'all'
        ? 18140
        : channelFilter === 'youtube'
        ? 5940
        : channelFilter === 'instagram'
        ? 4680
        : channelFilter === 'facebook'
        ? 3320
        : channelFilter === 'linkedin'
        ? 2610
        : 1590;
    const linkClicks = Math.round(baseClicks * windowScale);

    const deltaReach = timeWindow === '7d' ? '+18.4%' : timeWindow === '30d' ? '+24.1%' : '+31.6%';
    const deltaEng = channelFilter === 'youtube' ? '+1.4 pt' : '+0.8 pt';
    const deltaGrowth = timeWindow === '7d' ? '+12.9%' : '+19.2%';
    const deltaClicks = timeWindow === '90d' ? '+28.3%' : '+15.7%';

    return [
      {
        id: 'reach',
        label: 'Total Reach',
        value: formatMetricNumber(totalReach),
        delta: deltaReach,
        context: timeWindow === '7d' ? 'vs prior 7d' : timeWindow === '30d' ? 'vs prior 30d' : 'vs prior quarter',
        tone: 'indigo' as const,
      },
      {
        id: 'engagement',
        label: 'Engagement Rate',
        value: `${avgEngagement.toFixed(1)}%`,
        delta: deltaEng,
        context: 'likes, saves & replies',
        tone: 'rose' as const,
      },
      {
        id: 'growth',
        label: 'Audience Growth',
        value: `+${formatMetricNumber(netGrowth)}`,
        delta: deltaGrowth,
        context: 'net new followers',
        tone: 'cyan' as const,
      },
      {
        id: 'clicks',
        label: 'Campaign Clicks',
        value: formatMetricNumber(linkClicks),
        delta: deltaClicks,
        context: 'attributed UTM visits',
        tone: 'emerald' as const,
      },
    ];
  }, [series, channelFilter, accounts, timeWindow]);

  const upcomingPosts = useMemo(() => {
    return posts
      .filter((p) => p.status === 'scheduled')
      .filter((p) => channelFilter === 'all' || p.channels.includes(channelFilter))
      .sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`))
      .slice(0, 3);
  }, [posts, channelFilter]);

  const publishedPosts = useMemo(() => {
    return posts
      .filter((p) => p.status === 'published' && p.metrics)
      .filter((p) => channelFilter === 'all' || p.channels.includes(channelFilter))
      .slice(0, 4);
  }, [posts, channelFilter]);

  const priorityThreads = useMemo(() => {
    return threads
      .filter((t) => channelFilter === 'all' || t.channel === channelFilter)
      .sort((a, b) => Number(b.unread) - Number(a.unread))
      .slice(0, 3);
  }, [threads, channelFilter]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(
      (c) => channelFilter === 'all' || c.channelFocus === channelFilter
    );
  }, [campaigns, channelFilter]);

  const growthPulsePosts = useMemo(() => {
    return posts
      .filter((p) => p.status === 'published' && (p.metrics?.engagementRate ?? 0) > preferences.growthPulseThreshold)
      .filter((p) => channelFilter === 'all' || p.channels.includes(channelFilter))
      .sort((a, b) => (b.metrics?.engagementRate ?? 0) - (a.metrics?.engagementRate ?? 0));
  }, [posts, preferences.growthPulseThreshold, channelFilter]);

  const stepThreshold = (delta: number) => {
    const next = Math.max(1, Math.min(25, Number((preferences.growthPulseThreshold + delta).toFixed(1))));
    onUpdatePreferences({ growthPulseThreshold: next });
  };

  return (
    <div className="space-y-6">
      {/* Studio Controls Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CHANNELS.map((ch) => (
            <ChannelPillButton
              key={ch}
              channel={ch}
              selected={channelFilter === ch}
              onClick={() => onChangeChannelFilter(ch)}
            />
          ))}
        </div>

        {/* Time Window Segmented Selector */}
        <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#e2e8f0] self-start lg:self-auto">
          {TIME_WINDOWS.map((win) => {
            const active = timeWindow === win.id;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() => onChangeTimeWindow(win.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#4648d4] text-white shadow-sm'
                    : 'text-[#464554] hover:text-[#0b1c30]'
                }`}
              >
                {win.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Column KPI Metric Strip */}
      <section aria-label="Key studio performance metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const pillColors =
            kpi.tone === 'indigo'
              ? 'bg-[#eef2ff] text-[#2f2ebe]'
              : kpi.tone === 'rose'
              ? 'bg-[#fdf2f8] text-[#b10e6b]'
              : kpi.tone === 'cyan'
              ? 'bg-[#ecfeff] text-[#00687a]'
              : 'bg-[#ecfdf5] text-[#15803d]';

          return (
            <div
              key={kpi.id}
              className="studio-card rounded-[2rem] p-5 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#464554]">{kpi.label}</span>
                <span className="text-[11px] font-semibold text-[#767586] whitespace-nowrap">
                  {channelFilter === 'all' ? 'All channels' : CHANNEL_META[channelFilter].label}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[30px] leading-[34px] font-bold tracking-[-0.02em] text-[#0b1c30] tabular-nums">
                  {kpi.value}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums whitespace-nowrap shrink-0 ${pillColors}`}
                >
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  <span>{kpi.delta}</span>
                </span>
              </div>

              <p className="text-xs text-[#767586]">{kpi.context}</p>
            </div>
          );
        })}
      </section>

      {/* Main 12-Column Studio Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Velocity Chart & Published Content */}
        <div className="xl:col-span-8 space-y-6">
          {/* Audience Velocity Card */}
          <section className="studio-card rounded-[2rem] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <div>
                <h2 className="font-display text-[22px] leading-[28px] font-semibold text-[#0b1c30]">
                  Reach & Delivery Velocity
                </h2>
                <p className="text-xs text-[#464554] mt-0.5">
                  Organic impressions across connected channels. Click channel pills below to isolate curves.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4648d4] hover:text-[#2f2ebe] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>Full Analytics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <VelocityChart data={series} activeChannel={channelFilter} />
          </section>

          {/* Recent Published Performance Table */}
          <section className="studio-card rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
                  Top Performing Releases
                </h2>
                <p className="text-xs text-[#464554] mt-0.5">
                  Attributed reach, engagement rate, and saves from recent published slots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#464554] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Leaderboard
              </button>
            </div>

            {publishedPosts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-[#0b1c30]">No published posts for this channel yet</p>
                <p className="text-xs text-[#767586] mt-1 mb-4">
                  Switch to All Channels or compose a new release for {channelFilter !== 'all' ? CHANNEL_META[channelFilter].label : 'your workspace'}.
                </p>
                <button
                  type="button"
                  onClick={onNewPost}
                  className="px-4 py-2 rounded-full bg-[#4648d4] text-white text-xs font-semibold cursor-pointer"
                >
                  Compose Post
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-[11px] font-bold text-[#767586] uppercase tracking-wider">
                      <th className="pb-3 pr-4">Release</th>
                      <th className="pb-3 px-3">Channels</th>
                      <th className="pb-3 px-3 text-right">Reach</th>
                      <th className="pb-3 px-3 text-right">Eng. Rate</th>
                      <th className="pb-3 pl-3 text-right">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]/70">
                    {publishedPosts.map((post) => (
                      <tr
                        key={post.id}
                        onClick={() => onEditPost(post)}
                        className="group hover:bg-[#f8f9ff] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <PostArtwork variant={post.artwork} className="w-12 h-9 shrink-0 rounded-xl" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0b1c30] group-hover:text-[#4648d4] transition-colors truncate">
                                {post.title}
                              </p>
                              <p className="text-xs text-[#767586] truncate">
                                {post.format} · {post.campaign}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {post.channels.map((ch) => (
                              <ChannelInlineText key={ch} channel={ch} />
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right text-sm font-semibold text-[#0b1c30] tabular-nums">
                          {formatMetricNumber(post.metrics?.reach ?? 0)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-sm font-semibold text-[#00687a] tabular-nums">
                          {post.metrics?.engagementRate.toFixed(1)}%
                        </td>
                        <td className="py-3.5 pl-3 text-right text-sm font-semibold text-[#0b1c30] tabular-nums">
                          {(post.metrics?.clicks ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns: Growth Pulse, Queue Rail, Priority Inbox, Active Campaigns */}
        <div className="xl:col-span-4 space-y-6">
          {/* Growth Pulse Monitor */}
          <section className="studio-card rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#b10e6b]" />
                <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
                  Growth Pulse
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-xs font-semibold text-[#4648d4] hover:text-[#2f2ebe] cursor-pointer whitespace-nowrap"
              >
                Settings
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] mb-4">
              <div>
                <p className="text-[11px] font-semibold text-[#767586]">Alert Threshold</p>
                <p className="font-display text-base font-bold text-[#0b1c30] tabular-nums">
                  &gt; {preferences.growthPulseThreshold.toFixed(1)}% eng.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepThreshold(-0.5)}
                  aria-label="Decrease Growth Pulse threshold"
                  className="w-8 h-8 rounded-full bg-white border border-[#cbd5e1] flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepThreshold(0.5)}
                  aria-label="Increase Growth Pulse threshold"
                  className="w-8 h-8 rounded-full bg-white border border-[#cbd5e1] flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!preferences.growthPulseEnabled ? (
              <div className="py-3 text-center">
                <p className="text-xs text-[#767586] mb-2">
                  Growth Pulse toast alerts are paused in preferences.
                </p>
                <button
                  type="button"
                  onClick={() => onUpdatePreferences({ growthPulseEnabled: true })}
                  className="px-3.5 py-1.5 rounded-full bg-[#fdf2f8] text-[#b10e6b] text-xs font-semibold cursor-pointer"
                >
                  Resume Monitoring
                </button>
              </div>
            ) : growthPulsePosts.length === 0 ? (
              <p className="text-xs text-[#767586] py-2">
                No published posts currently exceed {preferences.growthPulseThreshold.toFixed(1)}% engagement.
              </p>
            ) : (
              <div className="divide-y divide-[#e2e8f0]">
                {growthPulsePosts.map((post) => {
                  const eng = post.metrics?.engagementRate ?? 0;
                  const delta = (eng - preferences.growthPulseThreshold).toFixed(1);
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => onEditPost(post)}
                      className="w-full text-left py-3 first:pt-0 last:pb-0 hover:bg-[#f8f9ff] -mx-2 px-2 rounded-2xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#0b1c30] truncate">
                          {post.title}
                        </span>
                        <span className="text-xs font-bold text-[#b10e6b] tabular-nums shrink-0">
                          {eng.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1 text-xs text-[#767586]">
                        <div className="flex items-center gap-2">
                          {post.channels.slice(0, 2).map((ch) => (
                            <ChannelInlineText key={ch} channel={ch} />
                          ))}
                        </div>
                        <span className="text-[#15803d] font-semibold tabular-nums">
                          +{delta} pts
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Next in Queue */}
          <section className="studio-card rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4648d4]" />
                <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
                  Next in Queue
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('queue')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4648d4] hover:text-[#2f2ebe] cursor-pointer whitespace-nowrap"
              >
                <span>Open Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingPosts.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-semibold text-[#0b1c30]">Queue is clear</p>
                <p className="text-xs text-[#767586] mt-1 mb-3">
                  Schedule your next release to keep cadence steady.
                </p>
                <button
                  type="button"
                  onClick={onNewPost}
                  className="px-4 py-2 rounded-full bg-[#4648d4] text-white text-xs font-semibold cursor-pointer"
                >
                  Schedule Post
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#e2e8f0]">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3"
                  >
                    <PostArtwork variant={post.artwork} className="w-14 h-14 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-[#767586] tabular-nums">
                        <span>{post.scheduledDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.scheduledTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditPost(post)}
                        className="text-left text-sm font-semibold text-[#0b1c30] hover:text-[#4648d4] transition-colors line-clamp-1 mt-0.5 cursor-pointer"
                      >
                        {post.title}
                      </button>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1">
                        {post.channels.map((ch) => (
                          <ChannelInlineText key={ch} channel={ch} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Priority Inbox */}
          <section className="studio-card rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#b10e6b]" />
                <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
                  Priority Threads
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inbox')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4648d4] hover:text-[#2f2ebe] cursor-pointer whitespace-nowrap"
              >
                <span>Inbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#e2e8f0]">
              {priorityThreads.map((thread) => {
                const lastMsg = thread.messages[thread.messages.length - 1];
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => onOpenThread(thread.id)}
                    className="w-full text-left py-3 first:pt-0 last:pb-0 hover:bg-[#f8f9ff] -mx-2 px-2 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0b1c30] truncate">
                        {thread.contactName}
                      </span>
                      <span className="text-[11px] font-semibold text-[#767586] shrink-0 tabular-nums">
                        {thread.updatedAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#464554] mt-0.5">
                      <ChannelInlineText channel={thread.channel} />
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{thread.category}</span>
                      {thread.unread && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-[#b10e6b]">Unread</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-[#464554] line-clamp-2 mt-1 leading-relaxed">
                      {lastMsg?.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Campaign Conversion Pulse */}
          <section className="studio-card rounded-[2rem] p-5">
            <h2 className="font-display text-lg font-semibold text-[#0b1c30] mb-1">
              Active Campaigns
            </h2>
            <p className="text-xs text-[#464554] mb-4">
              Attributed conversion velocity and link CTR.
            </p>

            <div className="space-y-4">
              {filteredCampaigns.map((camp) => (
                <div key={camp.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#0b1c30] truncate">
                      {camp.name}
                    </span>
                    <span className="text-xs font-bold text-[#0b1c30] tabular-nums shrink-0">
                      {camp.conversions.toLocaleString()} conv.
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#767586]">
                    <ChannelInlineText channel={camp.channelFocus} />
                    <span className="tabular-nums">
                      CTR {camp.ctr}% · {camp.windowLabel}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#eff4ff] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${camp.budgetUsedPct}%`,
                        backgroundColor: CHANNEL_META[camp.channelFocus].accentHex,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

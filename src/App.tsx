import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bot,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  Plus,
  Settings,
} from 'lucide-react';
import {
  ChannelAccount,
  ChannelId,
  ChatTurn,
  InboxThread,
  ScheduledPost,
  ScreenId,
  StudioPreferences,
  TimeWindow,
} from './types/studio';
import {
  ACTIVE_CAMPAIGNS,
  INITIAL_ACCOUNTS,
  INITIAL_POSTS,
  INITIAL_PREFERENCES,
  INITIAL_THREADS,
} from './data/seedData';
import { DashboardScreen } from './screens/DashboardScreen';
import { QueueScreen } from './screens/QueueScreen';
import { InboxScreen } from './screens/InboxScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AssistantScreen } from './screens/AssistantScreen';
import { ComposerModal } from './components/ComposerModal';
import { GrowthPulseAlert, GrowthPulseToast } from './components/GrowthPulseToast';

const STORAGE_KEY = 'studio-pulse-state-v1';

interface StoredState {
  posts: ScheduledPost[];
  threads: InboxThread[];
  accounts: ChannelAccount[];
  preferences: StudioPreferences;
  chatHistory: ChatTurn[];
}

function loadStoredState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      if (parsed.posts && parsed.threads && parsed.accounts && parsed.preferences) {
        const mapLegacyChannel = (ch: string): ChannelId =>
          ch === 'tiktok' ? 'youtube' : (ch as ChannelId);

        const migratedPosts = parsed.posts.map((p) => ({
          ...p,
          channels: Array.from(new Set(p.channels.map((ch) => mapLegacyChannel(ch as string)))),
        }));

        const migratedThreads = parsed.threads.map((t) => ({
          ...t,
          channel: mapLegacyChannel(t.channel as string),
        }));

        const filteredAccounts = parsed.accounts.filter((a) => (a.id as string) !== 'tiktok');
        const presentIds = new Set(filteredAccounts.map((a) => a.id));
        const mergedAccounts = [
          ...filteredAccounts,
          ...INITIAL_ACCOUNTS.filter((def) => !presentIds.has(def.id)),
        ];

        return {
          posts: migratedPosts,
          threads: migratedThreads,
          accounts: mergedAccounts,
          preferences: { ...INITIAL_PREFERENCES, ...parsed.preferences },
          chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : [],
        };
      }
    }
  } catch {
    // Fallback to initial seed state
  }
  return {
    posts: INITIAL_POSTS,
    threads: INITIAL_THREADS,
    accounts: INITIAL_ACCOUNTS,
    preferences: INITIAL_PREFERENCES,
    chatHistory: [],
  };
}

const NAV_ITEMS: { id: ScreenId; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'queue', label: 'Content Queue', shortLabel: 'Queue', icon: CalendarClock },
  { id: 'inbox', label: 'Unified Inbox', shortLabel: 'Inbox', icon: Inbox },
  { id: 'analytics', label: 'Analytics', shortLabel: 'Analytics', icon: BarChart3 },
  { id: 'assistant', label: 'Studio Copilot', shortLabel: 'Copilot', icon: Bot },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

const SCREEN_TITLES: Record<ScreenId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Studio Dashboard',
    subtitle: 'Cross-channel reach velocity, upcoming queue, and priority conversations.',
  },
  queue: {
    title: 'Content Queue',
    subtitle: 'Plan, preview, and schedule multi-channel releases across the week.',
  },
  inbox: {
    title: 'Unified Inbox',
    subtitle: 'Triage creator partnerships, press inquiries, and community replies.',
  },
  analytics: {
    title: 'Channel Analytics',
    subtitle: 'Inspect engagement windows, format efficiency, and release attribution.',
  },
  assistant: {
    title: 'Studio Copilot',
    subtitle: 'Multi-turn Gemini strategy chat and real-time voice conversations.',
  },
  settings: {
    title: 'Channels & Settings',
    subtitle: 'Manage connected social profiles, UTM tagging, and studio preferences.',
  },
};

export default function App() {
  const initial = loadStoredState();

  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('7d');
  const [channelFilter, setChannelFilter] = useState<ChannelId | 'all'>('all');

  const [posts, setPosts] = useState<ScheduledPost[]>(initial.posts);
  const [threads, setThreads] = useState<InboxThread[]>(initial.threads);
  const [accounts, setAccounts] = useState<ChannelAccount[]>(initial.accounts);
  const [preferences, setPreferences] = useState<StudioPreferences>(initial.preferences);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>(initial.chatHistory);

  const [selectedThreadId, setSelectedThreadId] = useState<string>(initial.threads[0]?.id ?? '');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [growthAlerts, setGrowthAlerts] = useState<GrowthPulseAlert[]>([]);
  const seenPulseKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const payload: StoredState = { posts, threads, accounts, preferences, chatHistory };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [posts, threads, accounts, preferences, chatHistory]);

  // Growth Pulse monitor: watches posts data against user's engagement threshold preference
  useEffect(() => {
    if (!preferences.growthPulseEnabled) {
      seenPulseKeysRef.current.clear();
      setGrowthAlerts([]);
      return;
    }

    const threshold = preferences.growthPulseThreshold;
    const exceeding = posts
      .filter(
        (p) =>
          p.status === 'published' &&
          typeof p.metrics?.engagementRate === 'number' &&
          p.metrics.engagementRate > threshold
      )
      .sort((a, b) => (b.metrics?.engagementRate ?? 0) - (a.metrics?.engagementRate ?? 0));

    const newAlerts: GrowthPulseAlert[] = [];
    for (const post of exceeding) {
      const engagementRate = post.metrics!.engagementRate;
      const key = `${post.id}:${engagementRate}:${threshold}`;
      if (!seenPulseKeysRef.current.has(key)) {
        seenPulseKeysRef.current.add(key);
        newAlerts.push({
          key,
          post,
          engagementRate,
          threshold,
        });
      }
    }

    if (newAlerts.length > 0) {
      setGrowthAlerts((prev) => {
        const existingKeys = new Set(prev.map((a) => a.key));
        const unique = newAlerts.filter((a) => !existingKeys.has(a.key));
        return unique.length > 0 ? [...prev, ...unique] : prev;
      });
    }
  }, [posts, preferences.growthPulseEnabled, preferences.growthPulseThreshold]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const unreadCount = threads.filter((t) => t.unread).length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

  const handleOpenNewPost = () => {
    setEditingPost(null);
    setComposerOpen(true);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setComposerOpen(true);
  };

  const handleSavePost = (data: Omit<ScheduledPost, 'id'>, existingId?: string) => {
    if (existingId) {
      setPosts((prev) =>
        prev.map((p) => (p.id === existingId ? { ...data, id: existingId } : p))
      );
      showToast('Post updated in studio schedule.');
    } else {
      const created: ScheduledPost = {
        ...data,
        id: `post-${Date.now()}`,
      };
      setPosts((prev) => [created, ...prev]);
      showToast(data.status === 'draft' ? 'Saved as draft.' : 'Scheduled to Content Queue.');
    }
  };

  const handlePublishNow = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              status: 'published',
              metrics: p.metrics ?? {
                reach: 26400,
                engagementRate: 8.2,
                clicks: 980,
                saves: 615,
              },
            }
          : p
      )
    );
    showToast('Release published across selected channels.');
  };

  const handleDuplicatePost = (post: ScheduledPost) => {
    const copy: ScheduledPost = {
      ...post,
      id: `post-${Date.now()}`,
      title: `${post.title} (Copy)`,
      status: 'draft',
      metrics: undefined,
    };
    setPosts((prev) => [copy, ...prev]);
    showToast('Duplicated as draft.');
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('Post removed from queue.');
  };

  const handleOpenThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setActiveScreen('inbox');
  };

  const handleSendReply = (threadId: string, text: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              unread: false,
              updatedAt: 'Just now',
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'studio',
                  authorName: preferences.workspaceName,
                  text,
                  timestamp: 'Just now',
                },
              ],
            }
          : t
      )
    );
    showToast('Reply sent.');
  };

  const handleToggleUnread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unread: !t.unread } : t))
    );
  };

  const handleAssignThread = (threadId: string, assignee: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, assignee } : t))
    );
    showToast(`Assigned to ${assignee}.`);
  };

  const handleToggleAccount = (id: ChannelId) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a))
    );
  };

  const handleToggleAccountUtm = (id: ChannelId) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, autoUtm: !a.autoUtm } : a))
    );
  };

  const handleUpdatePreferences = (patch: Partial<StudioPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  };

  const handleResetWorkspace = () => {
    seenPulseKeysRef.current.clear();
    setGrowthAlerts([]);
    setPosts(INITIAL_POSTS);
    setThreads(INITIAL_THREADS);
    setAccounts(INITIAL_ACCOUNTS);
    setPreferences(INITIAL_PREFERENCES);
    setChatHistory([]);
    setSelectedThreadId(INITIAL_THREADS[0].id);
    showToast('Restored initial Studio Pulse workspace.');
  };

  const screenHeader = SCREEN_TITLES[activeScreen];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col lg:flex-row">
      {/* Desktop Studio Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-white border-r border-[#e2e8f0] px-4 py-6 justify-between">
        <div className="space-y-8">
          {/* Brand Wordmark */}
          <div className="px-3">
            <button
              type="button"
              onClick={() => setActiveScreen('dashboard')}
              className="font-display text-xl font-bold tracking-tight text-[#0b1c30] whitespace-nowrap cursor-pointer"
            >
              Studio Pulse
            </button>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Primary studio navigation" className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              const badge =
                item.id === 'inbox' && unreadCount > 0
                  ? unreadCount
                  : item.id === 'queue' && scheduledCount > 0
                  ? scheduledCount
                  : null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4648d4] text-white shadow-[0_4px_12px_rgba(70,72,212,0.24)]'
                      : 'text-[#464554] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {badge !== null && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#eff4ff] text-[#4648d4]'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Studio Profile */}
        <div className="pt-4 border-t border-[#e2e8f0] px-2">
          <button
            type="button"
            onClick={() => setActiveScreen('settings')}
            className="w-full text-left flex items-center gap-3 p-2 rounded-2xl hover:bg-[#f8f9ff] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#4648d4] text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
              {preferences.workspaceName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0b1c30] truncate">
                {preferences.workspaceName}
              </p>
              <p className="text-[11px] text-[#767586] truncate">
                {preferences.brandHandle}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Brand/Breadcrumb — Context — Primary Action */}
        <header className="sticky top-0 z-30 bg-[#f8f9ff]/90 backdrop-blur-md border-b border-[#e2e8f0] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="lg:hidden font-display text-lg font-bold tracking-tight text-[#0b1c30] whitespace-nowrap shrink-0">
              Studio Pulse
            </span>
            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#767586] whitespace-nowrap">{preferences.workspaceName}</span>
              <span className="text-[#c7c4d7]" aria-hidden="true">/</span>
              <h1 className="font-display font-semibold text-[#0b1c30] truncate">
                {screenHeader.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenNewPost}
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-[#4648d4] text-white text-xs sm:text-sm font-semibold shadow-[0_4px_12px_rgba(70,72,212,0.28)] hover:bg-[#3a3cc2] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </button>
          </div>
        </header>

        {/* Active Screen Canvas */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-10">
          {/* Screen Heading */}
          <div className="mb-6">
            <h2 className="font-display text-2xl sm:text-[28px] sm:leading-[34px] font-semibold tracking-[-0.02em] text-[#0b1c30]">
              {screenHeader.title}
            </h2>
            <p className="text-sm text-[#464554] mt-1">
              {screenHeader.subtitle}
            </p>
          </div>

          {activeScreen === 'dashboard' && (
            <DashboardScreen
              posts={posts}
              threads={threads}
              accounts={accounts}
              campaigns={ACTIVE_CAMPAIGNS}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              timeWindow={timeWindow}
              onChangeTimeWindow={setTimeWindow}
              channelFilter={channelFilter}
              onChangeChannelFilter={setChannelFilter}
              onNavigate={setActiveScreen}
              onOpenThread={handleOpenThread}
              onEditPost={handleEditPost}
              onNewPost={handleOpenNewPost}
            />
          )}

          {activeScreen === 'queue' && (
            <QueueScreen
              posts={posts}
              channelFilter={channelFilter}
              onChangeChannelFilter={setChannelFilter}
              onNewPost={handleOpenNewPost}
              onEditPost={handleEditPost}
              onPublishNow={handlePublishNow}
              onDuplicatePost={handleDuplicatePost}
              onDeletePost={handleDeletePost}
            />
          )}

          {activeScreen === 'inbox' && (
            <InboxScreen
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
              onSendReply={handleSendReply}
              onToggleUnread={handleToggleUnread}
              onAssignThread={handleAssignThread}
            />
          )}

          {activeScreen === 'analytics' && (
            <AnalyticsScreen
              accounts={accounts}
              posts={posts}
              timeWindow={timeWindow}
              onChangeTimeWindow={setTimeWindow}
            />
          )}

          {activeScreen === 'assistant' && (
            <AssistantScreen
              posts={posts}
              threads={threads}
              accounts={accounts}
              chatHistory={chatHistory}
              onUpdateChatHistory={setChatHistory}
            />
          )}

          {activeScreen === 'settings' && (
            <SettingsScreen
              accounts={accounts}
              posts={posts}
              preferences={preferences}
              onToggleAccount={handleToggleAccount}
              onToggleAccountUtm={handleToggleAccountUtm}
              onUpdatePreferences={handleUpdatePreferences}
              onResetWorkspace={handleResetWorkspace}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Pill Navigation Dock */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 studio-dock rounded-full px-2 py-1.5 flex items-center gap-1 max-w-[94vw]"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#4648d4] text-white'
                  : 'text-[#464554] hover:text-[#0b1c30]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {active && <span>{item.shortLabel}</span>}
            </button>
          );
        })}
      </nav>

      {/* Post Composer Modal */}
      <ComposerModal
        open={composerOpen}
        editingPost={editingPost}
        onClose={() => setComposerOpen(false)}
        onSave={handleSavePost}
      />

      {/* Growth Pulse Engagement Alert Toast */}
      <GrowthPulseToast
        alerts={growthAlerts}
        onDismissCurrent={() => setGrowthAlerts((prev) => prev.slice(1))}
        onDismissAll={() => setGrowthAlerts([])}
        onInspectPost={handleEditPost}
      />

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed right-4 sm:right-6 z-50 studio-dock rounded-full px-5 py-3 text-xs font-semibold text-[#0b1c30] ${
            growthAlerts.length > 0 ? 'bottom-56 lg:bottom-44' : 'bottom-20 lg:bottom-6'
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

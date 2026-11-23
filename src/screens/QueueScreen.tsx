import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Copy,
  Edit3,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { ChannelId, PostStatus, ScheduledPost } from '../types/studio';
import { ChannelInlineText, ChannelPillButton } from '../components/ChannelBadge';
import { PostArtwork } from '../components/PostArtwork';

interface QueueScreenProps {
  posts: ScheduledPost[];
  channelFilter: ChannelId | 'all';
  onChangeChannelFilter: (c: ChannelId | 'all') => void;
  onNewPost: () => void;
  onEditPost: (post: ScheduledPost) => void;
  onPublishNow: (postId: string) => void;
  onDuplicatePost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
}

const STATUS_TABS: { id: PostStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Releases' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
];

const CHANNELS: (ChannelId | 'all')[] = ['all', 'instagram', 'tiktok', 'linkedin', 'x'];

export const QueueScreen: React.FC<QueueScreenProps> = ({
  posts,
  channelFilter,
  onChangeChannelFilter,
  onNewPost,
  onEditPost,
  onPublishNow,
  onDuplicatePost,
  onDeletePost,
}) => {
  const [statusTab, setStatusTab] = useState<PostStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts
      .filter((p) => statusTab === 'all' || p.status === statusTab)
      .filter((p) => channelFilter === 'all' || p.channels.includes(channelFilter))
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q) ||
          p.campaign.toLowerCase().includes(q)
      )
      .sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`));
  }, [posts, statusTab, channelFilter, searchQuery]);

  const weekColumns = useMemo(() => {
    const days = [
      { date: '2026-11-23', label: 'Mon · Nov 23' },
      { date: '2026-11-24', label: 'Tue · Nov 24' },
      { date: '2026-11-25', label: 'Wed · Nov 25' },
      { date: '2026-11-26', label: 'Thu · Nov 26' },
      { date: '2026-11-27', label: 'Fri · Nov 27' },
    ];
    return days.map((d) => ({
      ...d,
      items: filteredPosts.filter((p) => p.scheduledDate === d.date),
    }));
  }, [filteredPosts]);

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#e2e8f0]">
            {STATUS_TABS.map((tab) => {
              const active = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#0b1c30] text-white'
                      : 'text-[#464554] hover:text-[#0b1c30]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#4648d4] text-white' : 'text-[#464554] hover:text-[#0b1c30]'
              }`}
            >
              Stream
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-[#4648d4] text-white' : 'text-[#464554] hover:text-[#0b1c30]'
              }`}
            >
              Week Grid
            </button>
          </div>
        </div>

        {/* Search & Compose */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#767586] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search copy or campaigns..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-white border border-[#cbd5e1] text-xs text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
            />
          </div>
          <button
            type="button"
            onClick={onNewPost}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#4648d4] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(70,72,212,0.28)] hover:bg-[#3a3cc2] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Release</span>
          </button>
        </div>
      </div>

      {/* Channel Filter Strip */}
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

      {/* Content */}
      {filteredPosts.length === 0 ? (
        <div className="studio-card rounded-[2rem] p-12 text-center">
          <h3 className="font-display text-xl font-semibold text-[#0b1c30]">
            No matching posts in this view
          </h3>
          <p className="text-sm text-[#464554] mt-1 mb-5">
            Adjust your channel or status filters, or compose a new studio release.
          </p>
          <button
            type="button"
            onClick={onNewPost}
            className="px-5 py-2.5 rounded-full bg-[#4648d4] text-white text-xs font-semibold cursor-pointer"
          >
            Create First Post
          </button>
        </div>
      ) : viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {weekColumns.map((col) => (
            <div key={col.date} className="studio-card rounded-[2rem] p-4 flex flex-col gap-3 min-h-[260px]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2.5">
                <span className="font-display text-sm font-semibold text-[#0b1c30]">{col.label}</span>
                <span className="text-xs font-semibold text-[#767586] tabular-nums">
                  {col.items.length}
                </span>
              </div>

              {col.items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <p className="text-xs text-[#767586] mb-2">Open release window</p>
                  <button
                    type="button"
                    onClick={onNewPost}
                    className="text-xs font-semibold text-[#4648d4] hover:underline cursor-pointer"
                  >
                    + Add Slot
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {col.items.map((post) => (
                    <div
                      key={post.id}
                      className="p-3 rounded-2xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#464554] tabular-nums">
                        <span>{post.scheduledTime}</span>
                        <span className="capitalize text-[#4648d4]">{post.status}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#0b1c30] line-clamp-2">
                        {post.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {post.channels.map((ch) => (
                          <ChannelInlineText key={ch} channel={ch} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#e2e8f0]">
                        <button
                          type="button"
                          onClick={() => onEditPost(post)}
                          className="text-[11px] font-semibold text-[#464554] hover:text-[#4648d4] cursor-pointer"
                        >
                          Edit
                        </button>
                        {post.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => onPublishNow(post.id)}
                            className="text-[11px] font-semibold text-[#00687a] hover:underline cursor-pointer"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPosts.map((post) => {
            const statusText =
              post.status === 'published'
                ? 'Published'
                : post.status === 'scheduled'
                ? 'Scheduled'
                : 'Draft';

            const statusColor =
              post.status === 'published'
                ? 'text-[#00687a]'
                : post.status === 'scheduled'
                ? 'text-[#4648d4]'
                : 'text-[#767586]';

            return (
              <article
                key={post.id}
                className="studio-card rounded-[2rem] p-5 flex flex-col sm:flex-row gap-4 justify-between"
              >
                <PostArtwork
                  variant={post.artwork}
                  className="w-full sm:w-36 h-36 sm:h-auto shrink-0 rounded-2xl"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`font-bold ${statusColor}`}>{statusText}</span>
                      <div className="flex items-center gap-2 text-[#767586] tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.scheduledDate}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.scheduledTime}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-[#0b1c30] mt-1 truncate">
                      {post.title}
                    </h3>

                    <p className="text-xs text-[#464554] mt-1 line-clamp-2 leading-relaxed">
                      {post.caption}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-[#767586]">
                      <span>{post.format}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.campaign}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#e2e8f0]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {post.channels.map((ch) => (
                        <ChannelInlineText key={ch} channel={ch} />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {post.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => onPublishNow(post.id)}
                          title="Publish now"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ecfeff] text-[#00687a] text-xs font-semibold hover:brightness-95 transition-all cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditPost(post)}
                        title="Edit post"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#464554] hover:bg-[#eff4ff] hover:text-[#4648d4] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicatePost(post)}
                        title="Duplicate post"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#464554] hover:bg-[#eff4ff] hover:text-[#4648d4] transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePost(post.id)}
                        title="Delete post"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#464554] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

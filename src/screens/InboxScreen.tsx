import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Search, Send, UserCheck } from 'lucide-react';
import { ChannelId, InboxThread } from '../types/studio';
import { TEAM_OPERATORS } from '../data/seedData';
import { ChannelInlineText, ChannelPillButton } from '../components/ChannelBadge';

interface InboxScreenProps {
  threads: InboxThread[];
  selectedThreadId: string;
  onSelectThread: (id: string) => void;
  onSendReply: (threadId: string, text: string) => void;
  onToggleUnread: (threadId: string) => void;
  onAssignThread: (threadId: string, assignee: string) => void;
}

const CHANNELS: (ChannelId | 'all')[] = ['all', 'instagram', 'youtube', 'facebook', 'linkedin', 'x'];

const QUICK_REPLIES = [
  'Thanks for reaching out — sending the press kit and sample sheet over now.',
  'Approved! Your updated UTM link is active and ready for bio placement.',
  'Appreciate the feedback — sharing this directly with our product team.',
];

export const InboxScreen: React.FC<InboxScreenProps> = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onSendReply,
  onToggleUnread,
  onAssignThread,
}) => {
  const [channelFilter, setChannelFilter] = useState<ChannelId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftReply, setDraftReply] = useState('');

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads
      .filter((t) => channelFilter === 'all' || t.channel === channelFilter)
      .filter((t) => statusFilter === 'all' || t.unread)
      .filter(
        (t) =>
          !q ||
          t.contactName.toLowerCase().includes(q) ||
          t.contactHandle.toLowerCase().includes(q) ||
          t.messages.some((m) => m.text.toLowerCase().includes(q))
      );
  }, [threads, channelFilter, statusFilter, searchQuery]);

  const activeThread =
    threads.find((t) => t.id === selectedThreadId) ?? filteredThreads[0] ?? null;

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !draftReply.trim()) return;
    onSendReply(activeThread.id, draftReply.trim());
    setDraftReply('');
  };

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CHANNELS.map((ch) => (
            <ChannelPillButton
              key={ch}
              channel={ch}
              selected={channelFilter === ch}
              onClick={() => setChannelFilter(ch)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#0b1c30] text-white' : 'text-[#464554]'
              }`}
            >
              All Threads
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unread')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'unread' ? 'bg-[#b10e6b] text-white' : 'text-[#464554]'
              }`}
            >
              Unread ({threads.filter((t) => t.unread).length})
            </button>
          </div>
        </div>
      </div>

      {/* Split-Pane Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Thread List */}
        <div className="lg:col-span-5 studio-card rounded-[2rem] p-4 flex flex-col max-h-[680px]">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-[#767586] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter messages or contacts..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#f8f9ff] border border-[#e2e8f0] text-xs text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#e2e8f0]/80 pr-1">
            {filteredThreads.length === 0 ? (
              <div className="py-12 text-center px-4">
                <p className="text-sm font-semibold text-[#0b1c30]">Inbox zero for this filter</p>
                <p className="text-xs text-[#767586] mt-1">
                  Switch back to All Threads to inspect resolved conversations.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                const lastMessage = thread.messages[thread.messages.length - 1];
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => onSelectThread(thread.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer my-1 ${
                      isSelected
                        ? 'bg-[#eff4ff] border border-[#c7c4d7]'
                        : 'hover:bg-[#f8f9ff] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0b1c30] truncate">
                        {thread.contactName}
                      </span>
                      <span className="text-[11px] font-semibold text-[#767586] tabular-nums shrink-0">
                        {thread.updatedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#464554] mt-1">
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

                    <p className="text-xs text-[#464554] line-clamp-2 mt-1.5 leading-relaxed">
                      {lastMessage?.text}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Conversation Pane */}
        <div className="lg:col-span-7 studio-card rounded-[2rem] flex flex-col min-h-[540px] max-h-[680px] overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <p className="font-display text-lg font-semibold text-[#0b1c30]">
                Select a conversation
              </p>
              <p className="text-xs text-[#767586] mt-1">
                Choose a thread on the left to review history and send a reply.
              </p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-6 py-4 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-lg font-semibold text-[#0b1c30] truncate">
                      {activeThread.contactName}
                    </h2>
                    <ChannelInlineText channel={activeThread.channel} />
                  </div>
                  <p className="text-xs text-[#464554] mt-0.5 truncate">
                    {activeThread.contactHandle} · {activeThread.contactRole}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f8f9ff] border border-[#e2e8f0] text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-[#4648d4]" />
                    <select
                      aria-label="Assign strategist"
                      value={activeThread.assignee}
                      onChange={(e) => onAssignThread(activeThread.id, e.target.value)}
                      className="bg-transparent text-xs font-semibold text-[#0b1c30] focus:outline-none cursor-pointer"
                    >
                      {TEAM_OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleUnread(activeThread.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeThread.unread
                        ? 'bg-[#eef2ff] text-[#4648d4] hover:bg-[#e1e0ff]'
                        : 'bg-[#ecfdf5] text-[#15803d] hover:brightness-95'
                    }`}
                  >
                    {activeThread.unread ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9ff]">
                {activeThread.messages.map((msg) => {
                  const isStudio = msg.sender === 'studio';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStudio ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-[#767586] mb-1 px-1">
                        <span className="font-semibold text-[#464554]">{msg.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[82%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                          isStudio
                            ? 'bg-[#4648d4] text-white rounded-br-md'
                            : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-bl-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Templates & Reply Box */}
              <div className="p-4 border-t border-[#e2e8f0] bg-white space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {QUICK_REPLIES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDraftReply(tpl)}
                      className="px-3 py-1 rounded-full bg-[#eff4ff] text-[#2f2ebe] text-[11px] font-semibold hover:bg-[#e1e0ff] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {tpl.slice(0, 40)}...
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmitReply} className="flex items-center gap-2.5">
                  <input
                    type="text"
                    value={draftReply}
                    onChange={(e) => setDraftReply(e.target.value)}
                    placeholder={`Reply to ${activeThread.contactName}...`}
                    className="flex-1 h-12 px-5 rounded-full bg-[#f8f9ff] border border-[#cbd5e1] text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!draftReply.trim()}
                    className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-[#4648d4] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(70,72,212,0.28)] hover:bg-[#3a3cc2] disabled:opacity-45 disabled:shadow-none transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

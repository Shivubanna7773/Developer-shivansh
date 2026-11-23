import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, Sparkles } from 'lucide-react';
import { ArtworkVariant, ChannelId, PostFormat, PostStatus, ScheduledPost } from '../types/studio';
import { CHANNEL_META } from '../data/seedData';
import { ChannelGlyph } from './ChannelBadge';
import { PostArtwork } from './PostArtwork';

interface ComposerModalProps {
  open: boolean;
  editingPost: ScheduledPost | null;
  onClose: () => void;
  onSave: (post: Omit<ScheduledPost, 'id'>, existingId?: string) => void;
}

const ALL_CHANNELS: ChannelId[] = ['instagram', 'youtube', 'facebook', 'linkedin', 'x'];
const FORMATS: PostFormat[] = ['Reel', 'Carousel', 'Short Video', 'Thread', 'Editorial Note'];
const ARTWORKS: { id: ArtworkVariant; label: string }[] = [
  { id: 'atelier-drop', label: 'Atelier Drop' },
  { id: 'packaging-film', label: 'Packaging Study' },
  { id: 'studio-walkthrough', label: 'Studio Film' },
  { id: 'founder-memo', label: 'Editorial Memo' },
  { id: 'material-study', label: 'Material Texture' },
  { id: 'campaign-launch', label: 'Campaign Stack' },
];
const CAMPAIGNS = ['Winter Capsule 26', 'Material Transparency', 'Studio Craft Series', 'Community Pop-Up'];

export const ComposerModal: React.FC<ComposerModalProps> = ({
  open,
  editingPost,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [channels, setChannels] = useState<ChannelId[]>(['instagram']);
  const [format, setFormat] = useState<PostFormat>('Reel');
  const [campaign, setCampaign] = useState(CAMPAIGNS[0]);
  const [scheduledDate, setScheduledDate] = useState('2026-11-24');
  const [scheduledTime, setScheduledTime] = useState('11:30');
  const [artwork, setArtwork] = useState<ArtworkVariant>('atelier-drop');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingPost) {
      setTitle(editingPost.title);
      setCaption(editingPost.caption);
      setChannels(editingPost.channels);
      setFormat(editingPost.format);
      setCampaign(editingPost.campaign);
      setScheduledDate(editingPost.scheduledDate);
      setScheduledTime(editingPost.scheduledTime);
      setArtwork(editingPost.artwork);
      setError('');
    } else {
      setTitle('');
      setCaption('');
      setChannels(['instagram', 'youtube']);
      setFormat('Reel');
      setCampaign(CAMPAIGNS[0]);
      setScheduledDate('2026-11-24');
      setScheduledTime('11:30');
      setArtwork('atelier-drop');
      setError('');
    }
  }, [open, editingPost]);

  if (!open) return null;

  const toggleChannel = (ch: ChannelId) => {
    setChannels((prev) =>
      prev.includes(ch) ? (prev.length > 1 ? prev.filter((item) => item !== ch) : prev) : [...prev, ch]
    );
  };

  const minCharLimit = Math.min(...channels.map((ch) => CHANNEL_META[ch].maxChars));
  const overLimit = caption.length > minCharLimit;

  const handleSubmit = (status: PostStatus) => {
    if (!title.trim()) {
      setError('Add a post headline before saving.');
      return;
    }
    if (!caption.trim()) {
      setError('Write post copy before scheduling.');
      return;
    }
    if (overLimit) {
      setError(`Copy exceeds the ${minCharLimit}-character limit for your selected channels.`);
      return;
    }

    onSave(
      {
        title: title.trim(),
        caption: caption.trim(),
        channels,
        format,
        status,
        scheduledDate,
        scheduledTime,
        campaign,
        artwork,
        metrics: editingPost?.metrics,
      },
      editingPost?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <div className="studio-popover w-full max-w-3xl rounded-3xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-white">
          <div>
            <h2 id="composer-title" className="font-display text-xl font-semibold text-[#0b1c30]">
              {editingPost ? 'Edit Studio Post' : 'Compose & Schedule Post'}
            </h2>
            <p className="text-xs text-[#464554] mt-0.5">
              Prepare multi-channel copy, select creative framing, and assign a release slot.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#464554] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#f8f9ff]">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Channels */}
            <div>
              <span className="block text-xs font-semibold text-[#464554] mb-2">
                Target Channels
              </span>
              <div className="flex flex-wrap gap-2">
                {ALL_CHANNELS.map((ch) => {
                  const selected = channels.includes(ch);
                  const meta = CHANNEL_META[ch];
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#0b1c30] text-white'
                          : 'bg-white text-[#464554] border border-[#e2e8f0] hover:bg-[#eff4ff]'
                      }`}
                    >
                      <ChannelGlyph channel={ch} className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="post-headline" className="block text-xs font-semibold text-[#464554] mb-1.5">
                Internal Headline
              </label>
              <input
                id="post-headline"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Winter Capsule Lookbook Teaser"
                className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
              />
            </div>

            {/* Copy */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="post-caption" className="text-xs font-semibold text-[#464554]">
                  Post Copy
                </label>
                <span
                  className={`text-xs tabular-nums font-semibold ${
                    overLimit ? 'text-[#ba1a1a]' : 'text-[#767586]'
                  }`}
                >
                  {caption.length} / {minCharLimit}
                </span>
              </div>
              <textarea
                id="post-caption"
                rows={4}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  setError('');
                }}
                placeholder="Write concise, high-signal copy tailored to your studio audience..."
                className="w-full p-4 rounded-2xl bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4] resize-none"
              />
            </div>

            {/* Format & Campaign */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="post-format" className="block text-xs font-semibold text-[#464554] mb-1.5">
                  Format
                </label>
                <select
                  id="post-format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as PostFormat)}
                  className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
                >
                  {FORMATS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="post-campaign" className="block text-xs font-semibold text-[#464554] mb-1.5">
                  Campaign
                </label>
                <select
                  id="post-campaign"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
                >
                  {CAMPAIGNS.map((camp) => (
                    <option key={camp} value={camp}>
                      {camp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="post-date" className="flex items-center gap-1.5 text-xs font-semibold text-[#464554] mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Release Date</span>
                </label>
                <input
                  id="post-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
                />
              </div>
              <div>
                <label htmlFor="post-time" className="flex items-center gap-1.5 text-xs font-semibold text-[#464554] mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Release Time (PST)</span>
                </label>
                <input
                  id="post-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-[#ba1a1a] bg-[#ffdad6] px-4 py-2.5 rounded-2xl">
                {error}
              </p>
            )}
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="studio-card rounded-3xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#464554]">Live Channel Preview</span>
                <span className="text-xs text-[#767586]">{format}</span>
              </div>
              <PostArtwork variant={artwork} className="w-full h-36 mb-3" />
              <div className="flex items-center gap-2 text-xs text-[#464554] mb-1.5">
                <span className="font-semibold text-[#0b1c30]">@korastudio</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{scheduledDate}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{scheduledTime}</span>
              </div>
              <h3 className="font-display text-base font-semibold text-[#0b1c30] mb-1">
                {title || 'Untitled Studio Post'}
              </h3>
              <p className="text-xs text-[#464554] leading-relaxed line-clamp-4">
                {caption || 'Your post copy preview will appear here as you type.'}
              </p>
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#464554] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#4648d4]" />
                <span>Visual Cover Style</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {ARTWORKS.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => setArtwork(art.id)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      artwork === art.id
                        ? 'bg-[#4648d4] text-white'
                        : 'bg-white text-[#464554] border border-[#e2e8f0] hover:bg-[#eff4ff]'
                    }`}
                  >
                    {art.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#464554] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold border border-[#4648d4] text-[#4648d4] hover:bg-[#eff4ff] transition-colors cursor-pointer whitespace-nowrap"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('scheduled')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#4648d4] text-white hover:bg-[#3a3cc2] shadow-[0_4px_12px_rgba(70,72,212,0.28)] transition-all cursor-pointer whitespace-nowrap"
            >
              {editingPost ? 'Update Schedule' : 'Schedule Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

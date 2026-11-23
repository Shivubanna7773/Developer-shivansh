import React, { useState } from 'react';
import { Check, FileDown, RotateCcw } from 'lucide-react';
import { ChannelAccount, ChannelId, ScheduledPost, StudioPreferences } from '../types/studio';
import { TEAM_OPERATORS } from '../data/seedData';
import { ChannelInlineText } from '../components/ChannelBadge';
import { downloadSetupGuidePdf } from '../utils/setupGuidePdf';

interface SettingsScreenProps {
  accounts: ChannelAccount[];
  posts: ScheduledPost[];
  preferences: StudioPreferences;
  onToggleAccount: (id: ChannelId) => void;
  onToggleAccountUtm: (id: ChannelId) => void;
  onUpdatePreferences: (patch: Partial<StudioPreferences>) => void;
  onResetWorkspace: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  accounts,
  posts,
  preferences,
  onToggleAccount,
  onToggleAccountUtm,
  onUpdatePreferences,
  onResetWorkspace,
}) => {
  const [savedNotice, setSavedNotice] = useState(false);

  const matchingPulseCount = posts.filter(
    (p) =>
      p.status === 'published' &&
      (p.metrics?.engagementRate ?? 0) > preferences.growthPulseThreshold
  ).length;

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Connected Channels */}
      <section className="studio-card rounded-[2rem] p-6">
        <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
          Connected Social Channels
        </h2>
        <p className="text-xs text-[#464554] mt-0.5 mb-5">
          Manage publishing access, automatic UTM link appending, and sync status per network.
        </p>

        <div className="divide-y divide-[#e2e8f0]">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <ChannelInlineText channel={acc.id} />
                  <span className="text-xs font-semibold text-[#0b1c30]">{acc.handle}</span>
                </div>
                <p className="text-xs text-[#767586] mt-1 tabular-nums">
                  {acc.followers.toLocaleString()} followers · Optimal slot {acc.optimalWindow}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#464554] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acc.autoUtm}
                    onChange={() => onToggleAccountUtm(acc.id)}
                    className="w-4 h-4 rounded accent-[#4648d4] cursor-pointer"
                  />
                  <span>Auto-UTM</span>
                </label>

                <button
                  type="button"
                  onClick={() => onToggleAccount(acc.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    acc.connected
                      ? 'bg-[#ecfdf5] text-[#15803d] hover:brightness-95'
                      : 'bg-[#f1f5f9] text-[#464554] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {acc.connected ? 'Active Sync' : 'Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workspace Identity & Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveWorkspace}
          className="lg:col-span-7 studio-card rounded-[2rem] p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
                Studio Workspace Profile
              </h2>
              <p className="text-xs text-[#464554] mt-0.5">
                Configure display identity, timezone, and publishing governance.
              </p>
            </div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d]">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ws-name" className="block text-xs font-semibold text-[#464554] mb-1.5">
                Studio Name
              </label>
              <input
                id="ws-name"
                type="text"
                value={preferences.workspaceName}
                onChange={(e) => onUpdatePreferences({ workspaceName: e.target.value })}
                className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
              />
            </div>

            <div>
              <label htmlFor="ws-handle" className="block text-xs font-semibold text-[#464554] mb-1.5">
                Primary Handle
              </label>
              <input
                id="ws-handle"
                type="text"
                value={preferences.brandHandle}
                onChange={(e) => onUpdatePreferences({ brandHandle: e.target.value })}
                className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ws-tz" className="block text-xs font-semibold text-[#464554] mb-1.5">
              Default Scheduling Timezone
            </label>
            <select
              id="ws-tz"
              value={preferences.defaultTimeZone}
              onChange={(e) => onUpdatePreferences({ defaultTimeZone: e.target.value })}
              className="w-full h-11 px-4 rounded-full bg-white border border-[#cbd5e1] text-sm text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#4648d4]/25 focus:border-[#4648d4]"
            >
              <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT)</option>
              <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                key: 'approvalRequired' as const,
                title: 'Require strategist sign-off before scheduled publishing',
              },
              {
                key: 'autoUtmTagging' as const,
                title: 'Append studio campaign UTM parameters to outbound links',
              },
              {
                key: 'weeklyExecutiveDigest' as const,
                title: 'Send Monday morning executive reach digest',
              },
              {
                key: 'growthPulseEnabled' as const,
                title: 'Enable Growth Pulse engagement spike notifications',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 text-xs font-semibold text-[#0b1c30] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={(e) => onUpdatePreferences({ [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded-lg accent-[#4648d4] cursor-pointer"
                />
                <span>{item.title}</span>
              </label>
            ))}
          </div>

          {/* Growth Pulse Threshold Control */}
          <div className="pt-4 border-t border-[#e2e8f0] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="gp-threshold" className="text-xs font-semibold text-[#0b1c30]">
                Growth Pulse Engagement Threshold (%)
              </label>
              <span className="text-xs font-bold text-[#b10e6b] tabular-nums">
                {preferences.growthPulseThreshold.toFixed(1)}% ({matchingPulseCount}{' '}
                {matchingPulseCount === 1 ? 'post' : 'posts'} above)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="gp-threshold"
                type="range"
                min="1"
                max="15"
                step="0.5"
                disabled={!preferences.growthPulseEnabled}
                value={preferences.growthPulseThreshold}
                onChange={(e) =>
                  onUpdatePreferences({ growthPulseThreshold: parseFloat(e.target.value) })
                }
                className="flex-1 accent-[#b10e6b] cursor-pointer disabled:opacity-50"
              />
              <input
                type="number"
                aria-label="Growth Pulse threshold percentage"
                min="1"
                max="25"
                step="0.5"
                disabled={!preferences.growthPulseEnabled}
                value={preferences.growthPulseThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!Number.isNaN(val) && val >= 0.5 && val <= 100) {
                    onUpdatePreferences({ growthPulseThreshold: val });
                  }
                }}
                className="w-20 h-10 px-3 rounded-full bg-white border border-[#cbd5e1] text-xs font-bold text-center text-[#0b1c30] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#b10e6b]/25 focus:border-[#b10e6b] disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-[#767586]">
              Triggers a dashboard alert toast whenever a published post exceeds this engagement rate.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#4648d4] text-white text-xs font-semibold shadow-[0_4px_12px_rgba(70,72,212,0.28)] hover:bg-[#3a3cc2] transition-all cursor-pointer"
            >
              Save Workspace Preferences
            </button>
          </div>
        </form>

        {/* Team & Demo Reset */}
        <div className="lg:col-span-5 space-y-6">
          <section className="studio-card rounded-[2rem] p-6">
            <h2 className="font-display text-lg font-semibold text-[#0b1c30]">
              Studio Operators
            </h2>
            <p className="text-xs text-[#464554] mt-0.5 mb-4">
              Active strategists assigned to queue and inbox triage.
            </p>
            <div className="divide-y divide-[#e2e8f0]">
              {TEAM_OPERATORS.map((name, idx) => (
                <div key={name} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0b1c30]">{name}</p>
                    <p className="text-xs text-[#767586]">
                      {idx === 0 ? 'Lead Brand Strategist' : idx === 1 ? 'Motion & Community' : 'Growth Analyst'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#4648d4]">Editor</span>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-card rounded-[2rem] p-6">
            <h2 className="font-display text-base font-semibold text-[#0b1c30]">
              Setup Guide & Workspace Data
            </h2>
            <p className="text-xs text-[#464554] mt-1 mb-4">
              Export the full Studio Pulse installation and operations manual as a PDF, or restore demo data.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={downloadSetupGuidePdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4648d4] text-white text-xs font-semibold hover:bg-[#3a3cc2] shadow-[0_4px_12px_rgba(70,72,212,0.24)] transition-all cursor-pointer whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Setup Guide (PDF)</span>
              </button>
              <button
                type="button"
                onClick={onResetWorkspace}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#cbd5e1] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Initial Studio Data</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

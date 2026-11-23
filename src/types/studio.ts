export type ScreenId = 'dashboard' | 'queue' | 'inbox' | 'analytics' | 'assistant' | 'settings';

export type ChatModelId =
  | 'gemini-4-hydrogen'
  | 'gemini-3.1-flash-lite'
  | 'gemini-4-carbon'
  | 'gemini-4-neon';

export type AssistantRoleId =
  | 'strategist'
  | 'copywriter'
  | 'analyst'
  | 'campaign_architect';

export type LiveVoiceName = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';

export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  model?: ChatModelId;
  roleId?: AssistantRoleId;
  timestamp: string;
}

export type ChannelId = 'instagram' | 'tiktok' | 'linkedin' | 'x';

export type TimeWindow = '7d' | '30d' | '90d';

export type PostStatus = 'scheduled' | 'draft' | 'published';

export type PostFormat = 'Reel' | 'Carousel' | 'Short Video' | 'Thread' | 'Editorial Note';

export type ArtworkVariant =
  | 'atelier-drop'
  | 'packaging-film'
  | 'founder-memo'
  | 'material-study'
  | 'studio-walkthrough'
  | 'campaign-launch';

export interface ScheduledPost {
  id: string;
  title: string;
  caption: string;
  channels: ChannelId[];
  format: PostFormat;
  status: PostStatus;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  campaign: string;
  artwork: ArtworkVariant;
  metrics?: {
    reach: number;
    engagementRate: number;
    clicks: number;
    saves: number;
  };
}

export interface InboxMessage {
  id: string;
  sender: 'external' | 'studio';
  authorName: string;
  text: string;
  timestamp: string;
}

export interface InboxThread {
  id: string;
  contactName: string;
  contactHandle: string;
  contactRole: string;
  channel: ChannelId;
  category: 'Direct Message' | 'Comment' | 'Creator Partnership' | 'Press Inquiry';
  unread: boolean;
  priority: 'high' | 'normal';
  assignee: string;
  updatedAt: string;
  messages: InboxMessage[];
}

export interface VelocityPoint {
  label: string;
  instagram: number;
  tiktok: number;
  linkedin: number;
  x: number;
}

export interface ChannelAccount {
  id: ChannelId;
  name: string;
  handle: string;
  followers: number;
  followerDeltaPct: number;
  avgEngagement: number;
  connected: boolean;
  autoUtm: boolean;
  optimalWindow: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  channelFocus: ChannelId;
  conversions: number;
  ctr: number;
  budgetUsedPct: number;
  windowLabel: string;
}

export interface StudioPreferences {
  workspaceName: string;
  brandHandle: string;
  defaultTimeZone: string;
  autoUtmTagging: boolean;
  weeklyExecutiveDigest: boolean;
  approvalRequired: boolean;
  compactTables: boolean;
  growthPulseEnabled: boolean;
  growthPulseThreshold: number;
}

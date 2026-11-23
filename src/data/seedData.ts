import {
  CampaignSummary,
  ChannelAccount,
  ChannelId,
  InboxThread,
  ScheduledPost,
  StudioPreferences,
  TimeWindow,
  VelocityPoint,
} from '../types/studio';

export const CHANNEL_META: Record<
  ChannelId,
  {
    label: string;
    shortLabel: string;
    accentHex: string;
    washBg: string;
    textColor: string;
    maxChars: number;
  }
> = {
  instagram: {
    label: 'Instagram',
    shortLabel: 'IG',
    accentHex: '#EC4899',
    washBg: '#FDF2F8',
    textColor: '#b10e6b',
    maxChars: 2200,
  },
  tiktok: {
    label: 'TikTok',
    shortLabel: 'TT',
    accentHex: '#06B6D4',
    washBg: '#ECFEFF',
    textColor: '#00687a',
    maxChars: 2200,
  },
  linkedin: {
    label: 'LinkedIn',
    shortLabel: 'LI',
    accentHex: '#4648d4',
    washBg: '#EEF2FF',
    textColor: '#2f2ebe',
    maxChars: 3000,
  },
  x: {
    label: 'X',
    shortLabel: 'X',
    accentHex: '#334155',
    washBg: '#F1F5F9',
    textColor: '#334155',
    maxChars: 280,
  },
};

export const INITIAL_ACCOUNTS: ChannelAccount[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@korastudio.co',
    followers: 148200,
    followerDeltaPct: 14.2,
    avgEngagement: 5.8,
    connected: true,
    autoUtm: true,
    optimalWindow: '11:30 AM PST',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@korastudio',
    followers: 214900,
    followerDeltaPct: 22.6,
    avgEngagement: 7.4,
    connected: true,
    autoUtm: true,
    optimalWindow: '04:15 PM PST',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'Kora Design Atelier',
    followers: 46800,
    followerDeltaPct: 9.8,
    avgEngagement: 4.1,
    connected: true,
    autoUtm: true,
    optimalWindow: '08:45 AM PST',
  },
  {
    id: 'x',
    name: 'X',
    handle: '@koradesignlab',
    followers: 62400,
    followerDeltaPct: 6.3,
    avgEngagement: 2.9,
    connected: true,
    autoUtm: false,
    optimalWindow: '10:00 AM PST',
  },
];

export const VELOCITY_SERIES: Record<TimeWindow, VelocityPoint[]> = {
  '7d': [
    { label: 'Nov 17', instagram: 42800, tiktok: 61400, linkedin: 16200, x: 14100 },
    { label: 'Nov 18', instagram: 46200, tiktok: 68900, linkedin: 19400, x: 15800 },
    { label: 'Nov 19', instagram: 51400, tiktok: 74200, linkedin: 22100, x: 17200 },
    { label: 'Nov 20', instagram: 48900, tiktok: 82600, linkedin: 20500, x: 16400 },
    { label: 'Nov 21', instagram: 58300, tiktok: 91200, linkedin: 24800, x: 19100 },
    { label: 'Nov 22', instagram: 63400, tiktok: 96800, linkedin: 21400, x: 18500 },
    { label: 'Nov 23', instagram: 69100, tiktok: 108400, linkedin: 26300, x: 21200 },
  ],
  '30d': [
    { label: 'Wk 1', instagram: 218000, tiktok: 342000, linkedin: 94000, x: 78000 },
    { label: 'Wk 2', instagram: 246000, tiktok: 389000, linkedin: 108000, x: 84000 },
    { label: 'Wk 3', instagram: 289000, tiktok: 431000, linkedin: 121000, x: 91000 },
    { label: 'Wk 4', instagram: 334000, tiktok: 498000, linkedin: 138000, x: 102000 },
  ],
  '90d': [
    { label: 'Sep', instagram: 842000, tiktok: 1210000, linkedin: 312000, x: 268000 },
    { label: 'Oct', instagram: 986000, tiktok: 1480000, linkedin: 384000, x: 304000 },
    { label: 'Nov', instagram: 1184000, tiktok: 1765000, linkedin: 461000, x: 356000 },
  ],
};

export const INITIAL_POSTS: ScheduledPost[] = [
  {
    id: 'post-101',
    title: 'Winter Capsule Lookbook Teaser',
    caption:
      'Brushed wool meets architectural tailoring. The Winter Capsule opens early access to studio members tomorrow at 10:00 AM PST.',
    channels: ['instagram', 'tiktok'],
    format: 'Reel',
    status: 'scheduled',
    scheduledDate: '2026-11-23',
    scheduledTime: '11:30',
    campaign: 'Winter Capsule 26',
    artwork: 'atelier-drop',
  },
  {
    id: 'post-102',
    title: 'Zero-Plastic Packaging Engineering',
    caption:
      'Six months of molded mycelium tray testing reduced transit damage to 0.3% while cutting box volume by 28%. Full material breakdown inside.',
    channels: ['linkedin', 'x'],
    format: 'Carousel',
    status: 'scheduled',
    scheduledDate: '2026-11-24',
    scheduledTime: '09:00',
    campaign: 'Material Transparency',
    artwork: 'packaging-film',
  },
  {
    id: 'post-103',
    title: 'Inside the Color Grading Suite',
    caption:
      'How our motion director dials in natural daylight curves for lookbook reels without losing fabric texture.',
    channels: ['tiktok'],
    format: 'Short Video',
    status: 'scheduled',
    scheduledDate: '2026-11-25',
    scheduledTime: '16:15',
    campaign: 'Studio Craft Series',
    artwork: 'studio-walkthrough',
  },
  {
    id: 'post-104',
    title: 'Founder Note on Small-Batch Production',
    caption:
      'Why we cap seasonal runs at 600 units per silhouette and publish supplier lead times alongside every release.',
    channels: ['linkedin'],
    format: 'Editorial Note',
    status: 'draft',
    scheduledDate: '2026-11-26',
    scheduledTime: '08:45',
    campaign: 'Material Transparency',
    artwork: 'founder-memo',
  },
  {
    id: 'post-105',
    title: 'Tactile Knitwear Macro Study',
    caption:
      'Close-up weave geometry from our Kyoto mill partner. Tap to save the palette reference for your winter moodboard.',
    channels: ['instagram'],
    format: 'Carousel',
    status: 'draft',
    scheduledDate: '2026-11-27',
    scheduledTime: '12:00',
    campaign: 'Winter Capsule 26',
    artwork: 'material-study',
  },
  {
    id: 'post-106',
    title: 'Autumn Ceramics Pop-Up Recap',
    caption:
      '410 studio visitors across three days in Portland. Thank you to everyone who joined the glazing workshop and panel.',
    channels: ['instagram', 'tiktok', 'x'],
    format: 'Reel',
    status: 'published',
    scheduledDate: '2026-11-21',
    scheduledTime: '15:00',
    campaign: 'Community Pop-Up',
    artwork: 'campaign-launch',
    metrics: {
      reach: 184200,
      engagementRate: 7.9,
      clicks: 4820,
      saves: 3190,
    },
  },
  {
    id: 'post-107',
    title: 'Q4 Retail Conversion Playbook',
    caption:
      'Short-form product demos drove 3.2x higher landing page dwell time than static lookbook ads across our October cohort.',
    channels: ['linkedin', 'x'],
    format: 'Thread',
    status: 'published',
    scheduledDate: '2026-11-19',
    scheduledTime: '09:15',
    campaign: 'Studio Craft Series',
    artwork: 'founder-memo',
    metrics: {
      reach: 96400,
      engagementRate: 5.4,
      clicks: 3410,
      saves: 1640,
    },
  },
  {
    id: 'post-108',
    title: '60-Second Dye House Tour',
    caption:
      'Botanical indigo vats at 6 AM before the morning steam cycle starts. Sound on for the full shop floor ambient mix.',
    channels: ['tiktok', 'instagram'],
    format: 'Short Video',
    status: 'published',
    scheduledDate: '2026-11-18',
    scheduledTime: '16:30',
    campaign: 'Material Transparency',
    artwork: 'material-study',
    metrics: {
      reach: 241800,
      engagementRate: 8.6,
      clicks: 5290,
      saves: 6420,
    },
  },
];

export const INITIAL_THREADS: InboxThread[] = [
  {
    id: 'thr-1',
    contactName: 'Maya Lin-Vance',
    contactHandle: '@mayalinvance',
    contactRole: 'Editorial Stylist · Vogue Living',
    channel: 'instagram',
    category: 'Press Inquiry',
    unread: true,
    priority: 'high',
    assignee: 'Elena Rostova',
    updatedAt: '14m ago',
    messages: [
      {
        id: 'm-1',
        sender: 'external',
        authorName: 'Maya Lin-Vance',
        text: 'Hi Kora team! We are shooting our December Tactile Interiors feature on Thursday and would love to pull two ceramic vessel samples from the Winter Capsule.',
        timestamp: '08:36 AM',
      },
    ],
  },
  {
    id: 'thr-2',
    contactName: 'Devon Brooks',
    contactHandle: '@devon.creates',
    contactRole: 'Creator Partner · 380K Followers',
    channel: 'tiktok',
    category: 'Creator Partnership',
    unread: true,
    priority: 'high',
    assignee: 'Marcus Chen',
    updatedAt: '42m ago',
    messages: [
      {
        id: 'm-2a',
        sender: 'external',
        authorName: 'Devon Brooks',
        text: 'Just uploaded the rough cut for the studio desk setup reel. Want me to drop the 15-second teaser before Monday’s launch window?',
        timestamp: '07:45 AM',
      },
      {
        id: 'm-2b',
        sender: 'studio',
        authorName: 'Marcus Chen',
        text: 'Looks super crisp, Devon. Let us review the color pass with Elena and confirm your posting slot.',
        timestamp: '08:02 AM',
      },
      {
        id: 'm-2c',
        sender: 'external',
        authorName: 'Devon Brooks',
        text: 'Sounds good—also need the updated UTM tracking link for my bio before 11 AM if possible.',
        timestamp: '08:08 AM',
      },
    ],
  },
  {
    id: 'thr-3',
    contactName: 'Soren Lindqvist',
    contactHandle: 'Nordic Retail Group',
    contactRole: 'Head of Merchandising',
    channel: 'linkedin',
    category: 'Direct Message',
    unread: true,
    priority: 'normal',
    assignee: 'Elena Rostova',
    updatedAt: '2h ago',
    messages: [
      {
        id: 'm-3',
        sender: 'external',
        authorName: 'Soren Lindqvist',
        text: 'Great breakdown on your mycelium packaging post. Could your operations lead share the wholesale spec sheet for our Stockholm flagship?',
        timestamp: '06:50 AM',
      },
    ],
  },
  {
    id: 'thr-4',
    contactName: 'Camila Ortiz',
    contactHandle: '@camilaortiz_design',
    contactRole: 'Industrial Designer',
    channel: 'x',
    category: 'Comment',
    unread: false,
    priority: 'normal',
    assignee: 'Marcus Chen',
    updatedAt: 'Yesterday',
    messages: [
      {
        id: 'm-4a',
        sender: 'external',
        authorName: 'Camila Ortiz',
        text: 'Wait—did you actually hit 0.3% transit damage without foam inserts? Respect.',
        timestamp: 'Yesterday · 4:12 PM',
      },
      {
        id: 'm-4b',
        sender: 'studio',
        authorName: 'Marcus Chen',
        text: 'Appreciate that Camila! Happy to share the drop-test lab specs in a follow-up thread next week.',
        timestamp: 'Yesterday · 4:38 PM',
      },
    ],
  },
  {
    id: 'thr-5',
    contactName: 'Hannah Park',
    contactHandle: '@hannahpark.studio',
    contactRole: 'Ceramicist & Workshop Host',
    channel: 'instagram',
    category: 'Creator Partnership',
    unread: false,
    priority: 'normal',
    assignee: 'Elena Rostova',
    updatedAt: '2d ago',
    messages: [
      {
        id: 'm-5',
        sender: 'external',
        authorName: 'Hannah Park',
        text: 'Thank you for sharing the Portland pop-up recap reel! All the workshop attendees are tagging us nonstop.',
        timestamp: 'Nov 21 · 6:15 PM',
      },
    ],
  },
];

export const ACTIVE_CAMPAIGNS: CampaignSummary[] = [
  {
    id: 'camp-1',
    name: 'Winter Capsule 26',
    channelFocus: 'instagram',
    conversions: 1420,
    ctr: 4.8,
    budgetUsedPct: 64,
    windowLabel: 'Nov 15 – Dec 05',
  },
  {
    id: 'camp-2',
    name: 'Material Transparency',
    channelFocus: 'linkedin',
    conversions: 685,
    ctr: 3.9,
    budgetUsedPct: 48,
    windowLabel: 'Nov 01 – Nov 30',
  },
  {
    id: 'camp-3',
    name: 'Studio Craft Series',
    channelFocus: 'tiktok',
    conversions: 2190,
    ctr: 6.2,
    budgetUsedPct: 78,
    windowLabel: 'Nov 10 – Dec 10',
  },
];

export const INITIAL_PREFERENCES: StudioPreferences = {
  workspaceName: 'Kora Design Atelier',
  brandHandle: '@korastudio',
  defaultTimeZone: 'America/Los_Angeles (PST)',
  autoUtmTagging: true,
  weeklyExecutiveDigest: true,
  approvalRequired: true,
  compactTables: false,
  growthPulseEnabled: true,
  growthPulseThreshold: 7.5,
};

export const HEATMAP_PEAK_HOURS = [
  { day: 'Mon', slots: [24, 58, 72, 64, 48, 30] },
  { day: 'Tue', slots: [32, 68, 84, 71, 56, 38] },
  { day: 'Wed', slots: [29, 74, 89, 78, 63, 41] },
  { day: 'Thu', slots: [35, 71, 92, 85, 69, 44] },
  { day: 'Fri', slots: [28, 63, 76, 82, 74, 51] },
  { day: 'Sat', slots: [18, 44, 65, 79, 86, 62] },
  { day: 'Sun', slots: [16, 41, 61, 74, 81, 57] },
];

export const HEATMAP_SLOT_LABELS = ['6a', '9a', '12p', '3p', '6p', '9p'];

export const TEAM_OPERATORS = ['Elena Rostova', 'Marcus Chen', 'Priya Nair'];

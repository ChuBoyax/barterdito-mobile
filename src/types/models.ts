

export type ItemStatus = 'Active' | 'In Negotiation' | 'Traded';
export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';

export type Item = {
  id: string;
  userId?: string;
  title: string;
  category: string;
  condition: string;
  location: string;
  hearts: number;
  views: number;
  age: string;
  image: string;
  imageUrls?: string[];
  owner: string;
  ownerAvatar: string;
  ownerAvatarUrl?: string | null;
  rating: number;
  trades: number;
  wanted: string;
  description: string;
  status: ItemStatus;
  hot?: boolean;
  mine?: boolean;
  createdAt?: string;
};

export type User = {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  bio: string;
  location: string;
  joined: string;
  avatarUrl?: string | null;
  role?: 'member' | 'sentinel';
};

export type ProfileStats = {
  completed: number;
  totalTrades: number;
  rating: number;
  followers: number;
  following: number;
  profileStrength: number;
};

export type Trader = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  trades: number;
  color: string;
  avatarUrl?: string | null;
  location?: string;
};

export type OfferStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed';

export type Offer = {
  id: string;
  person: string;
  initials: string;
  theirs: Item;
  yours: Item;
  status: OfferStatus;
  time: string;
  received: boolean;
};

export type Thread = {
  id: string;
  name: string;
  initials: string;
  item?: string;
  preview: string;
  time: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
  image?: string;
};

export type TradeEvent = {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  location: string;
  attending: number;
  color: string;
};

export type ForumThread = {
  id: string;
  title: string;
  author: string;
  replies: number;
  time: string;
  pinned?: boolean;
};

export type Campaign = {
  id: string;
  title: string;
  description: string;
  raised: number;
  goal: number;
};

export type NotificationKind = 'offer' | 'heart' | 'trade' | 'follow' | 'badge' | 'system';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  text: string;
  time: string;
  unread: boolean;
};

export type LeaderboardEntry = {
  name: string;
  initials: string;
  points: number;
  trades: number;
  rank: number;
  isYou?: boolean;
};

export type TradeHistoryEntry = {
  id: string;
  title: string;
  partner: string;
  date: string;
  rating: number;
};

export type Review = {
  id: string;
  author: string;
  initials: string;
  rating: number;
  date: string;
  text: string;
};

export type AnalyticsMetric = {
  key: 'views' | 'hearts' | 'offers' | 'conversion';
  label: string;
  value: string;
  change: string;
};

export type AnalyticsSummary = {
  metrics: AnalyticsMetric[];
  viewsSeries: number[];
  seriesLabels: string[];
  growth: string;
};

export type ReferralSummary = {
  link: string;
  friendsJoined: number;
  pointsEarned: number;
  pending: number;
};

export type AdminSummary = {
  users: number;
  activePosts: number;
  openReports: number;
  completedTrades: number;
};

export type PolicySection = { title: string; body: string };
export type Faq = { title: string; body: string };

export type NotificationPrefs = {
  offers: boolean;
  messages: boolean;
  followers: boolean;
  hearts: boolean;
  system: boolean;
};

export type ItemDraft = {
  title: string;
  description: string;
  category: string;
  condition: string;
  lookingFor: string;
  location: string;
  tags: string;
  photos: string[];
};

export type MeetupProposal = {
  tradeId: string;
  date: string;
  time: string;
  location: string;
  notes: string;
};

export type DisputeInput = {
  trade: string;
  reason: string;
  details: string;
  evidence: string[];
};

export type ItemFilters = {
  category: string;
  search: string;
  condition: string;
  location: string;
  sort: 'Newest first' | 'Most hearts' | 'Most viewed';
};

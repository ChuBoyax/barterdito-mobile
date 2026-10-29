

export type ItemStatus = 'Active' | 'In Negotiation' | 'Traded';
export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';

export type Item = {
  id: string;
  userId?: string;
  title: string;
  category: string;
  condition: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  tags?: string[];
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
  createdAt?: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
};

export type Profile = {
  id: string;
  fullName: string;
  initials: string;
  bio: string;
  location: string;
  avatarUrl: string | null;
  createdAt: string;
  joined: string;
  emailVerified: boolean;
  listingCount: number;
  activeListingCount: number;
  tradedListingCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  /** Verified by both traders through the trade workflow. */
  completedTradeCount: number;
  reviewCount: number;
  averageRating: number | null;
};

export type Connection = {
  id: string;
  fullName: string;
  initials: string;
  location: string;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type Trader = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  trades: number;
  color?: string;
  avatarUrl?: string | null;
  location?: string;
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

export type LeaderboardEntry = {
  name: string;
  initials: string;
  points: number;
  trades: number;
  rank: number;
  isYou?: boolean;
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
  latitude: number | null;
  longitude: number | null;
  tags: string;
  status: ItemStatus;
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

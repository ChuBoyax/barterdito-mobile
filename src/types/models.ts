export type ItemStatus = 'Active' | 'In Negotiation' | 'Traded';

export type Item = {
  id: string;
  userId?: string;
  title: string;
  category: string;
  condition: string;
  /** The owner's public profile area; every listing uses it. */
  location: string;
  /** Distance from the browsing area, when the feed is filtered by location. */
  distanceKm?: number | null;
  tags?: string[];
  hearts: number;
  views: number;
  age: string;
  image: string;
  imageUrls?: string[];
  owner: string;
  ownerAvatar: string;
  ownerAvatarUrl?: string | null;
  /** Average of verified reviews; null until the owner has one. */
  rating: number | null;
  reviewCount?: number;
  trades: number;
  wanted: string;
  description: string;
  status: ItemStatus;
  hot?: boolean;
  mine?: boolean;
  createdAt?: string;
};

/** Structured profile address (backend `location_address`); names are canonical once saved. */
export type LocationAddress = {
  countryCode: string;
  country: string;
  regionCode: string;
  region: string;
  provinceCode: string;
  province: string;
  municipalityCode: string;
  municipality: string;
  barangayCode: string;
  barangay: string;
  postalCode: string;
};

/**
 * Where a trader is. `latitude`/`longitude` are the public area centre used for nearby
 * browsing; the GPS pair is the device reading, returned only to the account owner.
 */
export type ProfileArea = {
  location: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  locationAddress: LocationAddress | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
};

export type User = ProfileArea & {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  bio: string;
  joined: string;
  createdAt?: string;
  emailVerified?: boolean;
  avatarUrl?: string | null;
};

export type Profile = ProfileArea & {
  id: string;
  fullName: string;
  initials: string;
  bio: string;
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
  /** Average of verified reviews; null shows "No reviews". */
  rating: number | null;
  reviewCount?: number;
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

/** One trader's points this week (backend `/leaderboard`). */
export type LeaderboardEntry = {
  id: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  /** Null when the trader has no points yet this week. */
  rank: number | null;
  points: number;
  trades: number;
  reviewCount: number;
  rating: number | null;
};

/** A page of the weekly ranking. Later pages and the personal rank reuse `asOf` so scores stay consistent. */
export type LeaderboardPage = {
  entries: LeaderboardEntry[];
  podium: LeaderboardEntry[];
  total: number;
  weekStart: string;
  weekEnd: string;
  asOf: string;
  pointsPerTrade: number;
  pointsPerReviewStar: number;
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
  tags: string;
  status: ItemStatus;
  photos: string[];
};

export type DisputeInput = {
  trade: string;
  reason: string;
  details: string;
  evidence: string[];
};

/** Location is not a filter here: the feed itself is loaded for the chosen area. */
export type ItemFilters = {
  category: string;
  search: string;
  condition: string;
  sort: 'Nearest first' | 'Newest first' | 'Most hearts' | 'Most viewed';
};

/** A place to browse around: a Photon suggestion, or the signed-in trader's profile area. */
export type Place = { id: string; label: string; latitude: number; longitude: number };

/** One row of the backend's offline address catalogue (`/locations/*`). */
export type LocationOption = {
  code: string;
  name: string;
  postalFormat?: string;
  postalRegex?: string;
};

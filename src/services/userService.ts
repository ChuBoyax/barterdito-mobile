import type { Connection, LeaderboardEntry, LeaderboardPage, LocationAddress, NotificationPrefs, Profile, ProfileArea } from '@/types/models';
import { initialsOf } from '@/utils/format';
import { apiRequest, authenticatedRequest, isUnauthorized, mediaUrl } from './api';
import { joinedLabel } from './authService';
import { delay } from './client';
import { toAddress, toAddressRow, toArea, type AddressRow, type AreaRow } from './locationService';

type ProfileRow = AreaRow & {
  id: string;
  full_name: string;
  bio: string;
  location: string;
  avatar_url: string | null;
  created_at: string;
  email_verified: boolean;
  listing_count: number;
  active_listing_count: number;
  traded_listing_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  completed_trade_count?: number;
  review_count?: number;
  average_rating?: number | null;
};

type ConnectionRow = Pick<ProfileRow, 'id' | 'full_name' | 'location' | 'avatar_url' | 'is_following'>;
type ConnectionsResponse = { people: ConnectionRow[]; total: number; limit: number; offset: number };

export type ConnectionKind = 'followers' | 'following';
export type ConnectionsPage = { people: Connection[]; total: number };

/**
 * Omit `avatar` to keep the photo, null removes it, a data URL replaces it.
 * Omit `area` to keep the saved address, area centre and GPS; send it only when the
 * location was edited, since the backend treats every field it receives as a change.
 */
export type ProfileWrite = {
  fullName: string;
  bio: string;
  location: string;
  avatar?: string | null;
  area?: Omit<ProfileArea, 'location'>;
};

type ResolvedRow = { label: string; latitude: number; longitude: number; location_address?: AddressRow | null };

/** "Use my location" result: named area for review; nothing is saved until the profile is. */
export type DetectedArea = { label: string; latitude: number; longitude: number; address: LocationAddress | null };

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    initials: initialsOf(row.full_name) || 'BD',
    bio: row.bio,
    ...toArea(row),
    avatarUrl: mediaUrl(row.avatar_url),
    createdAt: row.created_at,
    joined: joinedLabel(row.created_at),
    emailVerified: row.email_verified,
    listingCount: row.listing_count,
    activeListingCount: row.active_listing_count,
    tradedListingCount: row.traded_listing_count,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    isFollowing: row.is_following,
    completedTradeCount: row.completed_trade_count ?? 0,
    reviewCount: row.review_count ?? 0,
    averageRating: row.average_rating ?? null,
  };
}

type LeaderboardEntryRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rank: number | null;
  points: number;
  completed_trades_count: number;
  review_count: number;
  average_rating: number | null;
};

type LeaderboardRow = {
  entries: LeaderboardEntryRow[];
  podium: LeaderboardEntryRow[];
  total: number;
  week_start: string;
  week_end: string;
  as_of: string;
  score_rules?: { points_per_trade: number; points_per_review_star: number };
};

function toLeaderboardEntry(row: LeaderboardEntryRow): LeaderboardEntry {
  return {
    id: row.id,
    name: row.full_name,
    initials: initialsOf(row.full_name) || 'BD',
    avatarUrl: mediaUrl(row.avatar_url),
    rank: row.rank,
    points: row.points,
    trades: row.completed_trades_count,
    reviewCount: row.review_count,
    rating: row.average_rating,
  };
}

function toConnection(row: ConnectionRow): Connection {
  return {
    id: row.id,
    fullName: row.full_name,
    initials: initialsOf(row.full_name) || 'BD',
    location: row.location,
    avatarUrl: mediaUrl(row.avatar_url),
    isFollowing: row.is_following,
  };
}

/** Profile completion uses the same five checks as the website. */
export function profileCompletion(profile: Pick<Profile, 'fullName' | 'emailVerified' | 'bio' | 'location' | 'avatarUrl'>): number {
  const checks = [profile.fullName.trim(), profile.emailVerified, profile.bio.trim(), profile.location.trim(), profile.avatarUrl];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

let prefs: NotificationPrefs = { offers: true, messages: true, followers: true, hearts: true, system: true };

export const userService = {
  async getMyProfile(): Promise<Profile> {
    return toProfile(await authenticatedRequest(() => apiRequest<ProfileRow>('/profiles/me')));
  },

  async saveProfile({ fullName, bio, location, avatar, area }: ProfileWrite): Promise<Profile> {
    const body: Record<string, unknown> = { full_name: fullName.trim(), bio: bio.trim(), location: location.trim() };
    if (avatar !== undefined) body.avatar = avatar;
    if (area) {
      Object.assign(body, {
        location_latitude: area.locationLatitude,
        location_longitude: area.locationLongitude,
        location_address: area.locationAddress ? toAddressRow(area.locationAddress) : null,
        gps_latitude: area.gpsLatitude,
        gps_longitude: area.gpsLongitude,
      });
    }
    return toProfile(await authenticatedRequest(() => apiRequest<ProfileRow>('/profiles/me', { method: 'PUT', body, timeout: 30_000 })));
  },

  /** Names the device's area (POST keeps the coordinates out of URLs and logs). */
  async resolveCurrentArea(latitude: number, longitude: number): Promise<DetectedArea> {
    const row = await authenticatedRequest(() =>
      apiRequest<ResolvedRow>('/profiles/me/location/resolve', { method: 'POST', body: { latitude, longitude }, timeout: 20_000 }),
    );
    return { label: row.label, latitude: row.latitude, longitude: row.longitude, address: toAddress(row.location_address) };
  },

  /** Public profile; `isFollowing` reflects the signed-in viewer when there is one. */
  async getProfile(id: string): Promise<Profile> {
    const path = `/profiles/${encodeURIComponent(id)}`;
    try {
      return toProfile(await authenticatedRequest(() => apiRequest<ProfileRow>(path)));
    } catch (error) {
      // An expired viewer session should not hide a public profile.
      if (!isUnauthorized(error)) throw error;
      return toProfile(await apiRequest<ProfileRow>(path));
    }
  },

  async setFollowing(id: string, follow: boolean): Promise<Profile> {
    return toProfile(
      await authenticatedRequest(() =>
        apiRequest<ProfileRow>(`/profiles/${encodeURIComponent(id)}/follow`, { method: follow ? 'POST' : 'DELETE' }),
      ),
    );
  },

  async getConnections(kind: ConnectionKind, offset = 0): Promise<ConnectionsPage> {
    const result = await authenticatedRequest(() =>
      apiRequest<ConnectionsResponse>(`/profiles/me/connections?kind=${kind}&limit=50&offset=${offset}`),
    );
    return { people: result.people.map(toConnection), total: result.total };
  },

  /** Weekly ranking (Monday to Monday, Asia/Manila); pass the first page's `asOf` for later pages. */
  async getLeaderboard(offset = 0, asOf?: string): Promise<LeaderboardPage> {
    const snapshot = asOf ? `&as_of=${encodeURIComponent(asOf)}` : '';
    const row = await apiRequest<LeaderboardRow>(`/leaderboard?limit=20&offset=${offset}${snapshot}`);
    return {
      entries: row.entries.map(toLeaderboardEntry),
      podium: row.podium.map(toLeaderboardEntry),
      total: row.total,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      asOf: row.as_of,
      pointsPerTrade: row.score_rules?.points_per_trade ?? 100,
      pointsPerReviewStar: row.score_rules?.points_per_review_star ?? 10,
    };
  },

  /** The signed-in trader's own rank, even outside the loaded page; `rank` is null when unranked. */
  async getMyRank(asOf: string): Promise<LeaderboardEntry> {
    const row = await authenticatedRequest(() => apiRequest<{ entry: LeaderboardEntryRow }>(`/leaderboard/me?as_of=${encodeURIComponent(asOf)}`));
    return toLeaderboardEntry(row.entry);
  },

  /** Notification switches are local on the website too. */
  async getNotificationPrefs(): Promise<NotificationPrefs> {
    return delay({ ...prefs }, 100);
  },

  async updateNotificationPrefs(next: NotificationPrefs): Promise<void> {
    prefs = { ...next };
    await delay(undefined, 100);
  },

  /** Reports are a preview on the website; nothing is stored yet. */
  async reportUser(traderId: string, reason: string): Promise<void> {
    void traderId;
    void reason;
    await delay(undefined);
  },
};

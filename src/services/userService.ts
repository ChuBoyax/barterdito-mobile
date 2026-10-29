import { mockLeaderboard } from '@/mocks/users';
import type { Connection, LeaderboardEntry, NotificationPrefs, Profile } from '@/types/models';
import { initialsOf } from '@/utils/format';
import { apiRequest, authenticatedRequest, isUnauthorized, mediaUrl } from './api';
import { joinedLabel } from './authService';
import { clone, delay } from './client';

type ProfileRow = {
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

/** Omit `avatar` to keep the photo, null removes it, a data URL replaces it. */
export type ProfileWrite = { fullName: string; bio: string; location: string; avatar?: string | null };

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    initials: initialsOf(row.full_name) || 'BD',
    bio: row.bio,
    location: row.location,
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

  async saveProfile({ fullName, bio, location, avatar }: ProfileWrite): Promise<Profile> {
    const body: Record<string, unknown> = { full_name: fullName.trim(), bio: bio.trim(), location: location.trim() };
    if (avatar !== undefined) body.avatar = avatar;
    return toProfile(await authenticatedRequest(() => apiRequest<ProfileRow>('/profiles/me', { method: 'PUT', body, timeout: 30_000 })));
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

  /** Leaderboard is still sample data on the website. */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return delay(clone(mockLeaderboard));
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

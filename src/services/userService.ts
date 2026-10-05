import { mockItems } from '@/mocks/items';
import {
  mockCurrentUser,
  mockLeaderboard,
  mockProfileStats,
  mockReviews,
  mockTradeHistory,
  mockTraders,
} from '@/mocks/users';
import type {
  LeaderboardEntry,
  NotificationPrefs,
  ProfileStats,
  Review,
  TradeHistoryEntry,
  Trader,
  User,
} from '@/types/models';
import { clone, delay, ServiceError } from './client';

let following = new Set<string>(['mika-santos', 'bea-mendoza']);
let prefs: NotificationPrefs = { offers: true, messages: true, followers: true, hearts: true, system: true };

export const userService = {
 
  async getCurrentUser(): Promise<User> {
    return delay(clone(mockCurrentUser));
  },

  async getProfileStats(): Promise<ProfileStats> {
    return delay(clone(mockProfileStats));
  },

 
  async getTrader(id: string): Promise<Trader> {
    const known = mockTraders.find((trader) => trader.id === id);
    const fromItem = mockItems.find((item) => item.userId === id);
    if (!known && !fromItem) throw new ServiceError('Trader not found');
    return delay({
      id,
      name: known?.name ?? fromItem!.owner,
      initials: known?.initials ?? fromItem!.ownerAvatar,
      rating: known?.rating ?? fromItem!.rating,
      trades: known?.trades ?? fromItem!.trades,
      color: known?.color ?? '#5c7cfa',
      location: fromItem?.location,
    });
  },

  async getFeaturedTraders(): Promise<Trader[]> {
    return delay(clone(mockTraders.slice(0, 4)));
  },

  
  async getFollowers(): Promise<Trader[]> {
    return delay(clone(mockTraders));
  },

  async getFollowing(): Promise<Trader[]> {
    return delay(clone(mockTraders.filter((trader) => following.has(trader.id))));
  },

  async isFollowing(traderId: string): Promise<boolean> {
    return delay(following.has(traderId), 100);
  },

  async setFollowing(traderId: string, value: boolean): Promise<void> {
    following = new Set(following);
    if (value) following.add(traderId);
    else following.delete(traderId);
    await delay(undefined, 150);
  },

  async getTradeHistory(): Promise<TradeHistoryEntry[]> {
    return delay(clone(mockTradeHistory));
  },

  async getReviews(): Promise<Review[]> {
    return delay(clone(mockReviews));
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return delay(clone(mockLeaderboard));
  },


  async getNotificationPrefs(): Promise<NotificationPrefs> {
    return delay({ ...prefs }, 100);
  },

  async updateNotificationPrefs(next: NotificationPrefs): Promise<void> {
    prefs = { ...next };
    await delay(undefined, 100);
  },

  async reportUser(traderId: string, reason: string): Promise<void> {
    void traderId;
    void reason;
    await delay(undefined);
  },
};

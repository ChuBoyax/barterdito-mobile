import {
  mockActivity,
  mockAdminSummary,
  mockAnalytics,
  mockCampaign,
  mockEvents,
  mockFaqs,
  mockForumThreads,
  mockNotifications,
  mockPrivacy,
  mockReferral,
  mockTerms,
} from '@/mocks/community';
import type {
  AdminSummary,
  AnalyticsSummary,
  AppNotification,
  Campaign,
  Faq,
  ForumThread,
  PolicySection,
  ReferralSummary,
  TradeEvent,
} from '@/types/models';
import { clone, delay } from './client';

let notifications = clone(mockNotifications);
const rsvps = new Set<string>();

export const communityService = {
  /** Backend: `trade_events`. */
  async getEvents(): Promise<TradeEvent[]> {
    return delay(clone(mockEvents));
  },

  async rsvpEvent(eventId: string): Promise<void> {
    rsvps.add(eventId);
    await delay(undefined, 200);
  },

  /** Backend: `forum_threads`. */
  async getForumThreads(): Promise<ForumThread[]> {
    return delay(clone(mockForumThreads));
  },

  async getActiveCampaign(): Promise<Campaign> {
    return delay(clone(mockCampaign));
  },

  /** Backend: `notifications` for the current user (latest 30). */
  async getNotifications(): Promise<AppNotification[]> {
    return delay(clone(notifications), 200);
  },

  async markAllNotificationsRead(): Promise<void> {
    notifications = notifications.map((entry) => ({ ...entry, unread: false }));
    await delay(undefined, 150);
  },

  async getActivity(): Promise<AppNotification[]> {
    return delay(clone(mockActivity));
  },

  /** Backend: aggregate views/hearts/offers for the current user's posts. */
  async getAnalytics(): Promise<AnalyticsSummary> {
    return delay(clone(mockAnalytics));
  },

  async getReferral(): Promise<ReferralSummary> {
    return delay(clone(mockReferral));
  },

  /** Backend: sentinel-only aggregates (must be enforced by RLS). */
  async getAdminSummary(): Promise<AdminSummary> {
    return delay(clone(mockAdminSummary));
  },

  getFaqs(): Faq[] {
    return mockFaqs;
  },

  getPolicy(type: 'privacy' | 'terms'): PolicySection[] {
    return type === 'privacy' ? mockPrivacy : mockTerms;
  },
};

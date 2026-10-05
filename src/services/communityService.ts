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
  
  async getEvents(): Promise<TradeEvent[]> {
    return delay(clone(mockEvents));
  },

  async rsvpEvent(eventId: string): Promise<void> {
    rsvps.add(eventId);
    await delay(undefined, 200);
  },

 
  async getForumThreads(): Promise<ForumThread[]> {
    return delay(clone(mockForumThreads));
  },

  async getActiveCampaign(): Promise<Campaign> {
    return delay(clone(mockCampaign));
  },

  
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

  
  async getAnalytics(): Promise<AnalyticsSummary> {
    return delay(clone(mockAnalytics));
  },

  async getReferral(): Promise<ReferralSummary> {
    return delay(clone(mockReferral));
  },

 
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

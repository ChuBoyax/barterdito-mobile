import {
  mockAdminSummary,
  mockAnalytics,
  mockCampaign,
  mockEvents,
  mockFaqs,
  mockForumThreads,
  mockPrivacy,
  mockReferral,
  mockTerms,
} from '@/mocks/community';
import type {
  AdminSummary,
  AnalyticsSummary,
  Campaign,
  Faq,
  ForumThread,
  PolicySection,
  ReferralSummary,
  TradeEvent,
} from '@/types/models';
import { clone, delay } from './client';

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

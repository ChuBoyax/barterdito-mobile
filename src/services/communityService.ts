import {
  mockFaqs,
  mockPrivacy,
  mockReferral,
  mockTerms,
} from '@/mocks/community';
import type { Faq, PolicySection, ReferralSummary } from '@/types/models';
import { clone, delay } from './client';

export const communityService = {
  async getReferral(): Promise<ReferralSummary> {
    return delay(clone(mockReferral));
  },

  getFaqs(): Faq[] {
    return mockFaqs;
  },

  getPolicy(type: 'privacy' | 'terms'): PolicySection[] {
    return type === 'privacy' ? mockPrivacy : mockTerms;
  },
};

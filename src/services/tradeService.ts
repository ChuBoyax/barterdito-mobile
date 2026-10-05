import { mockCompletedTrades, mockOffers } from '@/mocks/trades';
import type { DisputeInput, MeetupProposal, Offer, OfferStatus } from '@/types/models';
import { clone, delay, ServiceError } from './client';

let offers: Offer[] = clone(mockOffers);

export const tradeService = {
  /** Backend: `trade_offers` where sender or receiver = current user. */
  async getOffers(): Promise<Offer[]> {
    return delay(clone(offers));
  },

  async getOffer(id: string): Promise<Offer> {
    const offer = offers.find((entry) => entry.id === id);
    if (!offer) throw new ServiceError('Trade offer not found');
    return delay(clone(offer));
  },

  /**
   * Backend: update `trade_offers.status`, then
   * POST {API_URL}/api/notifications/trade-status { offerId, status }.
   */
  async updateOfferStatus(id: string, status: OfferStatus): Promise<Offer> {
    offers = offers.map((offer) => (offer.id === id ? { ...offer, status } : offer));
    const updated = offers.find((offer) => offer.id === id);
    if (!updated) throw new ServiceError('Trade offer not found');
    return delay(clone(updated), 300);
  },

  /** Backend: insert into `trade_offers`. */
  async proposeTrade(itemId: string, myItemId?: string): Promise<void> {
    void itemId;
    void myItemId;
    await delay(undefined, 400);
  },

  /** Backend: insert into `meetups`. */
  async proposeMeetup(proposal: MeetupProposal): Promise<void> {
    void proposal;
    await delay(undefined, 400);
  },

  /** Backend: insert into `trade_reviews`. */
  async submitReview(tradeId: string, rating: number, feedback: string): Promise<void> {
    void tradeId;
    void rating;
    void feedback;
    await delay(undefined, 400);
  },

  /** Backend: completed `trade_offers` for the current user. */
  async getCompletedTrades(): Promise<string[]> {
    return delay([...mockCompletedTrades]);
  },

  /** Backend: upload evidence to storage, insert into `disputes`. */
  async fileDispute(input: DisputeInput): Promise<void> {
    void input;
    await delay(undefined, 600);
  },
};

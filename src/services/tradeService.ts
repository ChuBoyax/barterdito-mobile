import { mockCompletedTrades, mockOffers } from '@/mocks/trades';
import type { DisputeInput, MeetupProposal, Offer, OfferStatus } from '@/types/models';
import { clone, delay, ServiceError } from './client';

let offers: Offer[] = clone(mockOffers);

export const tradeService = {
  
  async getOffers(): Promise<Offer[]> {
    return delay(clone(offers));
  },

  async getOffer(id: string): Promise<Offer> {
    const offer = offers.find((entry) => entry.id === id);
    if (!offer) throw new ServiceError('Trade offer not found');
    return delay(clone(offer));
  },

 
  async updateOfferStatus(id: string, status: OfferStatus): Promise<Offer> {
    offers = offers.map((offer) => (offer.id === id ? { ...offer, status } : offer));
    const updated = offers.find((offer) => offer.id === id);
    if (!updated) throw new ServiceError('Trade offer not found');
    return delay(clone(updated), 300);
  },


  async proposeTrade(itemId: string, myItemId?: string): Promise<void> {
    void itemId;
    void myItemId;
    await delay(undefined, 400);
  },


  async proposeMeetup(proposal: MeetupProposal): Promise<void> {
    void proposal;
    await delay(undefined, 400);
  },


  async submitReview(tradeId: string, rating: number, feedback: string): Promise<void> {
    void tradeId;
    void rating;
    void feedback;
    await delay(undefined, 400);
  },


  async getCompletedTrades(): Promise<string[]> {
    return delay([...mockCompletedTrades]);
  },

 
  async fileDispute(input: DisputeInput): Promise<void> {
    void input;
    await delay(undefined, 600);
  },
};

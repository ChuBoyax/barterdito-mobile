import { delay, ServiceError } from './client';

export type DonationInput = { amount: number; name: string; email: string };
export type DonationReceipt = { reference: string; amount: number; method: string; date: string };


export const paymentService = {
  async startDonation({ amount }: DonationInput): Promise<DonationReceipt> {
    if (amount < 20) throw new ServiceError('Minimum donation is ₱20');
    return delay(
      {
        reference: `MOCK-${Date.now().toString(36).toUpperCase()}`,
        amount,
        method: 'PayMongo checkout (mock)',
        date: new Date().toLocaleDateString('en-PH'),
      },
      900,
    );
  },
};

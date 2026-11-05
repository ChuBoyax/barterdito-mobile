import type {
  Faq,
  PolicySection,
  ReferralSummary,
} from '@/types/models';

export const mockReferral: ReferralSummary = {
  link: 'barterdito.ph/r/johnramirez',
  friendsJoined: 8,
  pointsEarned: 350,
  pending: 2,
};

export const mockFaqs: Faq[] = [
  { title: 'Getting started', body: 'Create a profile, browse nearby items, then post something useful you’re ready to trade.' },
  { title: 'How trade offers work', body: 'Choose one of your active items, add a note, and send the proposal. The owner can accept, decline, or chat.' },
  { title: 'Meeting safely', body: 'Use a busy public place, tell someone your plans, inspect items before confirming, and never share passwords or codes.' },
  { title: 'Reporting a problem', body: 'Use Report on an item, user, or conversation. Include clear details and photos when filing a dispute.' },
  { title: 'Payments and donations', body: 'Trading is cash-free. Donations are optional and processed securely through PayMongo.' },
];

export const mockPrivacy: PolicySection[] = [
  { title: 'Information we collect', body: 'Barterdito stores the profile, listing, trade, message, and safety information needed to operate the marketplace. Precise addresses are not shown on public listings.' },
  { title: 'How information is used', body: 'Information supports discovery, trade coordination, fraud prevention, notifications, analytics, and account support. We do not sell personal information.' },
  { title: 'Your controls', body: 'You can update your profile, notification preferences, privacy settings, blocked users, and request account deletion from Settings.' },
  { title: 'Retention and safety', body: 'Completed trade records may be retained for safety, dispute resolution, and legal compliance. Traded listings remain available to both parties for seven days.' },
];

export const mockTerms: PolicySection[] = [
  { title: 'Barter marketplace', body: 'Barterdito helps users exchange items and services without acting as the owner, seller, or guarantor of user listings.' },
  { title: 'User responsibilities', body: 'Describe items honestly, use lawful goods and services, communicate respectfully, and meet in safe public locations.' },
  { title: 'Prohibited activity', body: 'Scams, counterfeit goods, dangerous or illegal items, harassment, payment-code requests, and attempts to bypass safety controls are prohibited.' },
  { title: 'Disputes and enforcement', body: 'Barterdito may review evidence, restrict listings, suspend accounts, and preserve relevant records when resolving safety reports.' },
];

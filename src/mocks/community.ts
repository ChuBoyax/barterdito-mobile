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

export const mockEvents: TradeEvent[] = [
  {
    id: 'e1',
    title: 'Quezon City Community Swap',
    date: 'Aug 02 · 10:00 AM–4:00 PM',
    day: '02',
    month: 'AUG',
    location: 'Quezon Memorial Circle',
    attending: 184,
    color: '#ff8a34',
  },
  {
    id: 'e2',
    title: 'Makati Gadget Trade Day',
    date: 'Aug 09 · 1:00–6:00 PM',
    day: '09',
    month: 'AUG',
    location: 'Ayala Triangle Gardens',
    attending: 96,
    color: '#1e66d0',
  },
  {
    id: 'e3',
    title: 'Pasig Home & Hobby Exchange',
    date: 'Aug 16 · 9:00 AM–3:00 PM',
    day: '16',
    month: 'AUG',
    location: 'Capitol Commons',
    attending: 73,
    color: '#3fa879',
  },
];

export const mockForumThreads: ForumThread[] = [
  { id: 'f1', title: 'Best public meetup spots around Metro Manila', author: 'Mika S.', replies: 28, time: '8 min ago', pinned: true },
  { id: 'f2', title: 'How do you value used electronics fairly?', author: 'Paolo R.', replies: 16, time: '1h ago' },
  { id: 'f3', title: 'Show us your most memorable swap!', author: 'Bea M.', replies: 42, time: '3h ago' },
];

export const mockCampaign: Campaign = {
  id: 'c1',
  title: 'Trade Kits for 100 Students',
  description: 'Help equip public school learners with notebooks, bags, and reusable supplies.',
  raised: 34200,
  goal: 50000,
};

export const mockNotifications: AppNotification[] = [
  { id: 'n1', kind: 'offer', text: 'Mika sent a new offer for your iPhone 13 Mini', time: '12m', unread: true },
  { id: 'n2', kind: 'heart', text: 'Your Cordless Tool Set received a heart', time: '2h', unread: true },
  { id: 'n3', kind: 'trade', text: 'Paolo accepted your trade offer', time: '1d', unread: false },
  { id: 'n4', kind: 'follow', text: 'Bea started following you', time: '2d', unread: false },
];

export const mockActivity: AppNotification[] = [
  ...mockNotifications,
  { id: 'a1', kind: 'badge', text: 'You earned the Friendly Trader badge', time: '4d', unread: false },
  { id: 'a2', kind: 'system', text: 'Your profile reached 100 followers', time: '1w', unread: false },
];

export const mockAnalytics: AnalyticsSummary = {
  metrics: [
    { key: 'views', label: 'Total views', value: '2,418', change: '+18%' },
    { key: 'hearts', label: 'Hearts', value: '184', change: '+12%' },
    { key: 'offers', label: 'Offers', value: '37', change: '+8%' },
    { key: 'conversion', label: 'Conversion', value: '14.6%', change: '+2.1%' },
  ],
  viewsSeries: [28, 42, 34, 58, 50, 74, 68, 88, 61, 92, 78, 100],
  seriesLabels: ['Jun 24', 'Jul 8', 'Jul 23'],
  growth: '+18.4%',
};

export const mockReferral: ReferralSummary = {
  link: 'barterdito.ph/r/johnramirez',
  friendsJoined: 8,
  pointsEarned: 350,
  pending: 2,
};

export const mockAdminSummary: AdminSummary = {
  users: 24,
  activePosts: 15,
  openReports: 0,
  completedTrades: 10,
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

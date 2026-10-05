# Barterdito Mobile

Expo (React Native) version of the Barterdito barter marketplace, converted from
the Next.js web app in `../baterdito-web`.

This build is **UI only**. Every screen reads data through an async
**services layer** that currently returns mock data. The backend team replaces
the service implementations; screens do not need to change.

## Run it

```bash
npm install
npx expo start        # press a (Android), i (iOS), or w (web); or scan the QR with Expo Go
```

Demo login: any email plus a password of 8 or more characters.

## Project structure

```text
src/
├── app/                    # Routes only (Expo Router, file-based)
│   ├── _layout.tsx         # Fonts, providers, root Stack, onboarding
│   ├── (tabs)/             # Bottom tabs: Browse, Offers, Inbox, My Items, Profile
│   ├── items/[id].tsx      # Item details
│   ├── traders/[id].tsx    # Public trader profile
│   ├── messages/[id].tsx   # Trade chat
│   ├── direct-messages/    # Direct message list + chat
│   ├── login.tsx           # Login / sign-up (modal)
│   ├── menu.tsx            # Explore menu (modal)
│   └── …                   # post-item, events, community, settings, etc.
├── components/
│   ├── ui/                 # Generic building blocks (Button, Card, TextField, BottomSheet…)
│   ├── marketplace/        # Domain components (ItemCard, OfferCard, ThreadRow…)
│   ├── chat/               # ChatView, MessageBubble, MessageComposer
│   └── layout/             # RequireAuth, HeaderActions, Onboarding
├── services/               # ⬅ Backend integration point (mock implementations)
├── mocks/                  # Mock data used by services
├── providers/              # Theme, Toast, Auth, Marketplace (shared state)
├── hooks/                  # useAsync, useImagePicker
├── theme/                  # Colors (light/dark), DM Sans fonts, spacing
├── types/models.ts         # Domain types — the contract between UI and services
└── utils/                  # Formatting and AsyncStorage helpers
```

## Connecting the real backend

1. Keep each function signature in `src/services/*.ts`, and keep its return type
   from `src/types/models.ts`.
2. Replace the mock body with a Supabase query or an HTTP call. Remove the
   `delay()` and `clone()` calls.
3. Delete `src/mocks/` once nothing imports it.

| Service              | Replace with                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `authService`        | Supabase Auth (session stored with `expo-secure-store`)           |
| `itemService`        | `trade_posts`, `saved_items`, `post_hearts`, `reports`            |
| `tradeService`       | `trade_offers`, `meetups`, `trade_reviews`, `disputes`            |
| `messageService`     | `conversations`, `messages` + Supabase Realtime                   |
| `userService`        | `user_profiles`, `follows`, notification preferences              |
| `communityService`   | events, forum, notifications, analytics, admin aggregates         |
| `aiService`          | `POST {API_URL}/api/ai/description`, `/api/ai/recommendations`    |
| `paymentService`     | `POST {API_URL}/api/payments/donation` → open PayMongo checkout   |

`API_URL` is read from `EXPO_PUBLIC_API_URL` (see `src/services/client.ts`). It
points to the existing Next.js API routes on Vercel.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

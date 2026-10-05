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

## Design system

Colors and fonts match the website. `src/theme/colors.ts` mirrors the CSS
variables in `baterdito-web/app/globals.css` (`--orange`, `--ink`, `--muted`,
`--line`, `--surface`, `--background`…) for both light and dark mode, so a color
change on the web maps 1:1 to the app. Colors are flat — no decorative gradients.

Rules that keep the UI consistent:

- Never hardcode a color in a screen or component. Use `colors.*` from `useTheme()`.
- For accent pairs (soft background + strong foreground) use `tone(colors, 'orange' | 'green' | 'blue' | 'red' | 'yellow' | 'violet')` from `src/theme/tones.ts`. Components take a `tone` prop instead of raw colors.
- Shadows come from `elevation(1 | 2 | 3, colors)`.
- Text over photos uses `colors.onPhoto` on top of `<PhotoScrim />`.

| Building block   | Where                               | Use it for                                  |
| ---------------- | ----------------------------------- | ------------------------------------------- |
| Tokens           | `src/theme/colors.ts`, `tones.ts`   | All colors, light/dark                      |
| Tab config       | `src/navigation/tabs.ts`            | Add, remove, or reorder bottom tabs          |
| `TabBar`         | `components/layout/TabBar.tsx`      | Bottom navigation (reads the tab config)     |
| `AppHeader`      | `components/layout/AppHeader.tsx`   | Large-title header for tab screens           |
| `IconTile`       | `components/ui/IconTile.tsx`        | Soft or solid icon squares by `tone`         |
| `PressableScale` | `components/ui/PressableScale.tsx`  | Press feedback on anything tappable          |
| `Glass`          | `components/ui/Glass.tsx`           | Frosted buttons/bars placed over photos      |
| `PhotoScrim`     | `components/ui/PhotoScrim.tsx`      | Readable text on top of images               |

To add a tab: create `src/app/(tabs)/<name>.tsx` and add one entry to
`src/navigation/tabs.ts`.

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

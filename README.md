# 4Sale Reels

A responsive vertical-video listing feed designed for integration into the 4Sale website as a webview. It uses the official 4Sale visual tokens, Sakr Soft fonts, and production-derived listing fixtures with public media URLs.

## Run locally

```bash
npm ci
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

## Commands

```bash
npm run dev      # Start the local development server
npm run lint     # Run ESLint
npm run build    # Type-check and create the production bundle
npm run preview  # Preview the production bundle locally
```

## Architecture

```text
src/
├── app/                    # Application composition and page-level state
├── features/reels/
│   ├── components/         # Focused presentation components
│   ├── data/               # Sanitized production-derived fixtures
│   └── types.ts            # Domain and UI state types
└── styles/                 # Global tokens and responsive styling
```

The listing data is kept outside the UI, components are module-level and focused, navigation callbacks are stable, and transient interaction state stays close to the page that owns it. Replace `data/listings.ts` with a repository/query layer when the feed API is available; presentation components should continue to consume the `Listing` type.

## Current behavior

- Infinite-feeling vertical navigation with swipe, wheel, and arrow-key input.
- Drag-following transitions, cancelled-swipe snapback, and duplicate-input locking.
- Full-screen video on narrow webviews and a video/details split on wide webviews.
- Mobile details sheet with safe-area support.
- Favorite, share, chat, call, mute, and expanded-description interactions.
- A rolling two-video preload window that warms approximately three seconds of upcoming media.
- Ten sanitized, production-derived fixtures using public 4Sale video CDN URLs. Contact and private account data are excluded.

## Webview integration

- The app fills the available webview viewport; it does not render website navigation or demo controls.
- Mobile uses a full-screen reel with a details bottom sheet and safe-area spacing.
- Wide webviews place the reel and its details side by side.
- Replace `data/listings.ts` with the website API adapter and connect the call, chat, favorite, and share callbacks to the native/web integration layer.
- Navigate with vertical swipes, a mouse wheel, or arrow keys. Press `M` to toggle mute when a keyboard is available.

The browser preloader is best-effort because mobile browsers control cache persistence and may ignore preload hints. The proposed native webview cache, offline behavior, LRU policy, and HLS migration are documented in [Reel Video Cache and Low-Network Playback](docs/VIDEO_OFFLINE_CACHE.md).

## Integration assumptions

- Media URLs support HTTP range requests.
- The host app owns authentication, feed pagination, routing, analytics, and native call/chat actions.
- Feed responses will be mapped into the local `Listing` contract before reaching presentation components.
- Only the active video and two upcoming videos should be mounted or warmed to limit bandwidth and decoder pressure.
- Loading failures should preserve the previous playable frame instead of flashing an empty screen.

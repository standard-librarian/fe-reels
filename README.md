# 4Sale Reels

A responsive vertical-video listing feed designed for integration into the 4Sale website as a webview. It uses the official 4Sale visual tokens, Sakr Soft fonts, and the live Reels feed API.

## Run locally

```bash
npm ci
cp .env.example .env   # points at the staging API
npm run dev
```

Vite serves the app at `http://localhost:5173` by default. The app always talks to a real API; `VITE_API_BASE_URL` selects which one (empty = same origin).

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
│   ├── api/                # DTOs, HTTP client, mappers, and the ReelsSource port
│   ├── components/         # Focused presentation components
│   ├── hooks/              # Feed pagination and lazy detail fetching
│   └── types.ts            # Domain and UI state types
└── styles/                 # Global tokens and responsive styling
```

Wire formats stay in `api/dto.ts` and are translated by `api/mappers.ts` into the app's `Listing` type, so no presentation component depends on the backend's field names. `api/reelsSource.ts` is the port: swapping backends means adding one implementation, not touching the UI.

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

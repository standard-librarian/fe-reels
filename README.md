# Q84Sale Reels

A responsive, standalone reels experience intended to run as a 4Sale webview.

## Run locally

```bash
npm install
npm run dev
```

Create an optimized production bundle with `npm run build`.

## Architecture

```text
src/
├── app/                    # Application composition and page-level state
├── features/reels/
│   ├── components/         # Focused presentation components
│   ├── data/               # Mock listing repository (replace with API adapter)
│   └── types.ts            # Domain and UI state types
└── styles/                 # Global tokens and responsive styling
```

The listing data is kept outside the UI, components are module-level and focused, navigation callbacks are stable, and transient interaction state stays close to the page that owns it. When an API is introduced, replace `data/listings.ts` with a repository/query layer without changing the presentation components.

## Webview integration

- The app fills the available webview viewport; it does not render website navigation or demo controls.
- Mobile uses a full-screen reel with a details bottom sheet and safe-area spacing.
- Wide webviews place the reel and its details side by side.
- Replace `data/listings.ts` with the website API adapter and connect the call, chat, favorite, and share callbacks to the native/web integration layer.
- Navigate with vertical swipes, a mouse wheel, or arrow keys. Press `M` to toggle mute when a keyboard is available.

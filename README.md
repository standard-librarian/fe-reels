# Q84Sale Reels

A responsive React implementation of the `Q84Sale-Reels-handoff` prototype.

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

## Prototype controls

- Switch between Mobile and Desktop in the header.
- Preview Live, Loading, Empty, and Error states.
- Navigate reels with the arrow keys, mouse wheel, or vertical swipe. Gesture input is locked briefly after a successful navigation so one physical gesture always advances exactly one reel.
- Press `M` to toggle mute.

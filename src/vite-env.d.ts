/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Reels API. Empty = same origin. */
  readonly VITE_API_BASE_URL?: string
  /** Origin of the main 4Sale website, for linking a reel back to its listing page. Empty = same origin. */
  readonly VITE_WEB_BASE_URL?: string
  /** Fully-qualified base of the 4Sale services API for favorites writes, e.g. https://dev-services.q84sale.com/live/index.php */
  readonly VITE_FAVORITES_API_URL?: string
  /** Shared secret for the X-Custom-Authorization challenge (the web app's NEXT_PUBLIC_API_SECRET). */
  readonly VITE_FAVORITES_API_SECRET?: string
  /** Static device id standing in for a logged-in user (test-only, until merged into the web app). */
  readonly VITE_FAVORITES_DEVICE_ID?: string
  /** Static bearer token for the logged-in test user (test-only). */
  readonly VITE_FAVORITES_TOKEN?: string
  /** Amplitude client/browser API key. Empty = analytics disabled (track() no-ops). */
  readonly VITE_AMPLITUDE_API_KEY?: string
  /** Fraction of sessions to record with Session Replay (0..1). Defaults to 0.1. */
  readonly VITE_AMPLITUDE_SR_SAMPLE_RATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

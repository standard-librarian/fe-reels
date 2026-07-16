/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Reels API. Empty = same origin. */
  readonly VITE_API_BASE_URL?: string
  /** Fully-qualified base of the 4Sale services API for favorites writes, e.g. https://dev-services.q84sale.com/live/index.php */
  readonly VITE_FAVORITES_API_URL?: string
  /** Shared secret for the X-Custom-Authorization challenge (the web app's NEXT_PUBLIC_API_SECRET). */
  readonly VITE_FAVORITES_API_SECRET?: string
  /** Static device id standing in for a logged-in user (test-only, until merged into the web app). */
  readonly VITE_FAVORITES_DEVICE_ID?: string
  /** Static bearer token for the logged-in test user (test-only). */
  readonly VITE_FAVORITES_TOKEN?: string
  /** Logged-in user id sent on the feed request + events (test-only for now). */
  readonly VITE_REELS_USER_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

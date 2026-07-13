/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the Reels API. Empty = same origin (intercepted by MSW in dev). */
  readonly VITE_API_BASE_URL?: string
  /** Set to 'false' to disable the MSW mock backend in dev. */
  readonly VITE_API_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

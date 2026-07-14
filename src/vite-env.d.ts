/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the Reels API. Empty = same origin. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

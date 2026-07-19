// Amplitude Browser SDK bootstrap + the single `track()` entry point.
//
// This owns the whole SDK lifecycle for reels: one guarded init, the enrichment
// plugin (global props + PII scrub), and session replay (lazy-loaded, masked).
// Nothing else in the app imports the SDK — components call reelsAnalytics, which
// calls track(). No API key → the app runs normally and track() no-ops (DEV logs
// to the console so events are still visible locally).

import * as amplitude from '@amplitude/analytics-browser'
import { getViewerKey } from '../api/identity'
import { getDeviceId, getUserId } from '../../../services/session'
import { reelsEnrichmentPlugin } from './enrichmentPlugin'

const API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY
// Fraction of sessions that get a replay recording (0..1). Defaults to 10%.
const SR_SAMPLE_RATE = Number(import.meta.env.VITE_AMPLITUDE_SR_SAMPLE_RATE) || 0.1

let started = false
let ready = false

/** Initialise Amplitude once, at app startup. Safe to call more than once. */
export function bootstrapAmplitude(): void {
  if (started) return
  started = true

  if (!API_KEY) {
    if (import.meta.env.DEV) {
      console.debug('[reels-analytics] VITE_AMPLITUDE_API_KEY not set — Amplitude disabled, events log to console only')
    }
    return
  }

  amplitude.init(API_KEY, {
    // Identity from the host session (the single source the rest of the app uses),
    // so Amplitude correlates with the backend. Fall back to the always-present
    // per-browser viewer key so device_id is never empty. userId is set only for
    // logged-in users; guests stay device-only.
    deviceId: getDeviceId() || getViewerKey(),
    userId: getUserId() || undefined,
    autocapture: {
      sessions: true,
      pageViews: true,
      attribution: true,
      // Everything that could scrape the seller's phone off the DOM stays OFF —
      // element/form capture reads clicked-element text + hrefs (wa.me/…, tel:…),
      // which is exactly how numbers leaked into Amplitude before.
      elementInteractions: false,
      formInteractions: false,
      fileDownloads: false,
      networkTracking: false,
      frustrationInteractions: false,
    },
  })
  amplitude.add(reelsEnrichmentPlugin)
  ready = true

  // Session replay is heavier and optional — load it lazily so it never blocks
  // first paint. Masking: `conservative` masks all on-screen text (privacy-first,
  // per the requirement that the seller's number never appears), and `.amp-mask`
  // explicitly marks the phone element too (see ContactDialog).
  void import('@amplitude/plugin-session-replay-browser')
    .then(({ sessionReplayPlugin }) => {
      amplitude.add(sessionReplayPlugin({
        sampleRate: SR_SAMPLE_RATE,
        privacyConfig: {
          defaultMaskLevel: 'conservative',
          maskSelector: ['.amp-mask'],
        },
      }))
    })
    .catch(() => {
      /* replay is best-effort; never break the app over it */
    })
}

/** Log a reel event. No-ops until init succeeds; DEV logs when disabled. */
export function track(eventName: string, eventProperties?: Record<string, unknown>): void {
  if (!ready) {
    if (import.meta.env.DEV) console.debug('[reels-analytics]', eventName, eventProperties ?? {})
    return
  }
  amplitude.logEvent(eventName, eventProperties)
}

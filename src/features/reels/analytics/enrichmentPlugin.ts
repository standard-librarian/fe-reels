// Amplitude enrichment plugin. Registered once at init (see amplitude.ts).
//
// Because it's an `enrichment`-type plugin, the SDK calls execute() on EVERY
// event — including any Amplitude-autocaptured ones — before delivery. It does
// two jobs: stamp the global properties every reel event shares, and pipe the
// merged properties through the PII sanitizer. That makes sanitizeProperties the
// one gate all outgoing event data must cross.

import type { Types } from '@amplitude/analytics-browser'
import { sanitizeProperties } from './sanitize'

const GLOBAL_PROPERTIES: Record<string, string> = {
  Source: 'Reels',
  RegionName: 'Kuwait',
  RegionID: '1',
}

export const reelsEnrichmentPlugin: Types.Plugin = {
  name: 'reels-enrichment',
  type: 'enrichment',
  setup: async () => {},
  execute: async (event: Types.Event): Promise<Types.Event> => {
    // Event-specific props win over globals on any key collision.
    event.event_properties = sanitizeProperties({
      ...GLOBAL_PROPERTIES,
      ...event.event_properties,
    })
    return event
  },
}

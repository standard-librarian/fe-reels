import { useCallback, useEffect, useRef, useState } from 'react'
import { reelsSource } from '../api/reelsSource'
import type { Listing } from '../types'

// Fetch a full reel batch at once; the UI prefetches the next batch before the
// viewer reaches the end, rather than making a request for each visible reel.
const PAGE_LIMIT = 10

type FeedState = {
  listings: Listing[]
  loading: boolean // initial load
  error: string | null
}

/**
 * Cursor-paginated reels feed. Loads the first page on mount and exposes
 * `loadMore()` for infinite scroll (de-duped, guarded against overlap).
 *
 * `initialReelId` (deep link, e.g. ?reel={id} from the host site) promotes that
 * reel to the front of the feed: its detail is fetched alongside the first page
 * and prepended, and the seen-set drops the duplicate when pagination reaches
 * it. A failed or unplayable promoted reel falls back to the normal feed.
 */
export function useReelsFeed(initialReelId?: string | null) {
  const [state, setState] = useState<FeedState>({ listings: [], loading: true, error: null })

  const cursor = useRef<string | null>(null)
  const hasMore = useRef(true)
  const inFlight = useRef(false)
  const seen = useRef<Set<string>>(new Set())

  const load = useCallback(async (initial: boolean) => {
    if (inFlight.current) return
    if (!initial && !hasMore.current) return
    inFlight.current = true
    if (initial) setState(s => ({ ...s, loading: true, error: null }))
    try {
      // Fire both up front so the deep-linked reel doesn't delay the feed.
      const promotedPromise = initial && initialReelId
        ? reelsSource.getListingDetail(initialReelId).catch(() => null)
        : null
      const page = await reelsSource.getFeed({ cursor: initial ? null : cursor.current, limit: PAGE_LIMIT })
      const promoted = promotedPromise ? await promotedPromise : null
      cursor.current = page.nextCursor
      hasMore.current = page.hasMore
      setState(s => {
        if (initial) seen.current = new Set()
        const merged = initial ? [] : [...s.listings]
        if (initial && promoted && promoted.videoUrl) {
          seen.current.add(promoted.id)
          merged.push(promoted)
        }
        for (const item of page.listings) {
          if (!seen.current.has(item.id)) {
            seen.current.add(item.id)
            merged.push(item)
          }
        }
        return { listings: merged, loading: false, error: null }
      })
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'failed_to_load' }))
    } finally {
      inFlight.current = false
    }
  }, [initialReelId])

  useEffect(() => {
    void load(true)
  }, [load])

  const loadMore = useCallback(() => {
    void load(false)
  }, [load])

  const retry = useCallback(() => {
    cursor.current = null
    hasMore.current = true
    void load(true)
  }, [load])

  return {
    listings: state.listings,
    loading: state.loading,
    error: state.error,
    hasMore: () => hasMore.current,
    loadMore,
    retry,
  }
}

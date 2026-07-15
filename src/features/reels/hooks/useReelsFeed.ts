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
 */
export function useReelsFeed() {
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
      const page = await reelsSource.getFeed({ cursor: initial ? null : cursor.current, limit: PAGE_LIMIT })
      cursor.current = page.nextCursor
      hasMore.current = page.hasMore
      setState(s => {
        if (initial) seen.current = new Set()
        const merged = initial ? [] : [...s.listings]
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
  }, [])

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

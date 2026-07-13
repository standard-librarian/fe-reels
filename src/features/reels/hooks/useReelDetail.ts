import { useEffect, useState } from 'react'
import { reelsSource } from '../api/reelsSource'
import type { Listing } from '../types'

type DetailState = { detail: Listing | null; loading: boolean; error: string | null }
type Fetched = { id: string; detail: Listing | null; error: string | null }

// Session-scoped cache, shared across mounts. Kept at module scope (not a ref)
// so it can be read during render without tripping the hooks lint rules.
const detailCache = new Map<string, Listing>()

/**
 * Lazily fetches the full listing for `id` (pass null to fetch nothing).
 * Cached per id, so reopening the same reel is instant. The null/cached/loading
 * cases are derived during render; the effect only sets state from its callbacks.
 */
export function useReelDetail(id: string | null): DetailState {
  const [fetched, setFetched] = useState<Fetched | null>(null)

  useEffect(() => {
    if (!id || detailCache.has(id)) return
    let cancelled = false
    reelsSource
      .getListingDetail(id)
      .then(detail => {
        if (cancelled) return
        detailCache.set(id, detail)
        setFetched({ id, detail, error: null })
      })
      .catch(err => {
        if (cancelled) return
        setFetched({ id, detail: null, error: err instanceof Error ? err.message : 'failed_to_load' })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!id) return { detail: null, loading: false, error: null }
  const cached = detailCache.get(id)
  if (cached) return { detail: cached, loading: false, error: null }
  if (fetched && fetched.id === id) return { detail: fetched.detail, loading: false, error: fetched.error }
  return { detail: null, loading: true, error: null }
}

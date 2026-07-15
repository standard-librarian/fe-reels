// The "port": the app depends on this interface, not on HTTP details.
// HttpReelsSource is the adapter that talks to the contract endpoints and runs
// the mappers (returning the app's Listing model). Swapping backends = a new
// implementation here; nothing in the UI changes.

import { apiGet } from './httpClient'
import type { DetailResponseDTO, FeedResponseDTO } from './dto'
import { detailToListing, feedItemToListing } from './mappers'
import type { Listing } from '../types'

export type FeedParams = { cursor?: string | null; limit?: number }
export type FeedPage = { listings: Listing[]; nextCursor: string | null; hasMore: boolean }

const REELS_API_PATH = '/api/v1/reels'

// TODO(backend): no endpoint exists to persist a wishlist entry, so the heart is
// local-only today — tap it, reload, and it is gone. Add `toggleWishlist(id)`
// here once the write endpoint lands; the UI already calls through a single
// handler and will not need to change.
export interface ReelsSource {
  getFeed(params?: FeedParams): Promise<FeedPage>
  getListingDetail(id: string): Promise<Listing>
}

export class HttpReelsSource implements ReelsSource {
  async getFeed({ cursor, limit = 10 }: FeedParams = {}): Promise<FeedPage> {
    const res = await apiGet<FeedResponseDTO>(`${REELS_API_PATH}/feed`, { cursor, limit })
    return {
      listings: res.data.items.map(feedItemToListing),
      nextCursor: res.data.paging.next_cursor,
      hasMore: res.data.paging.has_more,
    }
  }

  async getListingDetail(id: string): Promise<Listing> {
    // TODO(contract): confirm the detail response is wrapped in `{ data }` like
    // the feed (the contract only documents the envelope for the feed endpoint).
    const res = await apiGet<DetailResponseDTO>(`${REELS_API_PATH}/feed/${id}`)
    return detailToListing(res.data)
  }

}

export const reelsSource: ReelsSource = new HttpReelsSource()

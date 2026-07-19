// The "port": the app depends on this interface, not on HTTP details.
// HttpReelsSource is the adapter that talks to the contract endpoints and runs
// the mappers (returning the app's Listing model). Swapping backends = a new
// implementation here; nothing in the UI changes.

import { ApiError, apiGet, apiPost } from './httpClient'
import type { AddFavoriteResponseDTO, DetailResponseDTO, FavoriteEnvelopeDTO, FeedResponseDTO, RemoveFavoriteResponseDTO } from './dto'
import { detailToListing, feedItemToListing } from './mappers'
import { favoritesUrl, signFavoriteRequest, type FavoriteAction } from './favoritesAuth'
import { getDeviceId, getUserId, getViewerKey } from './identity'
import type { Listing } from '../types'

export type FeedParams = { cursor?: string | null; limit?: number }
export type FeedPage = { listings: Listing[]; nextCursor: string | null; hasMore: boolean }

const REELS_API_PATH = '/api/v1/reels'

export interface ReelsSource {
  getFeed(params?: FeedParams): Promise<FeedPage>
  getListingDetail(id: string): Promise<Listing>
  // Wishlist writes. Return true when the server confirms the new state.
  addFavorite(id: string): Promise<boolean>
  removeFavorite(id: string): Promise<boolean>
}

export class HttpReelsSource implements ReelsSource {
  async getFeed({ cursor, limit = 10 }: FeedParams = {}): Promise<FeedPage> {
    // viewer_key + user_id let the backend attribute per-viewer wishlist state
    // (is_wishlist) to this request.
    const res = await apiGet<FeedResponseDTO>(`${REELS_API_PATH}/feed`, { cursor, limit, viewer_key: getViewerKey(), user_id: getUserId() })
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

  // Favorites live on a different host (the 4Sale services API) and need a signed
  // request, so they go through apiPost with headers from signFavoriteRequest —
  // not the same-origin apiGet the feed uses.
  async addFavorite(id: string): Promise<boolean> {
    const res = await this.postFavorite<AddFavoriteResponseDTO>('addFavorite', id)
    return res?.response?.is_favorite === 1
  }

  async removeFavorite(id: string): Promise<boolean> {
    const res = await this.postFavorite<RemoveFavoriteResponseDTO>('removeFavorite', id)
    return res?.response?.is_removed === 1
  }

  private async postFavorite<T extends FavoriteEnvelopeDTO>(action: FavoriteAction, id: string): Promise<T> {
    const url = favoritesUrl(action)
    // Serialize once: the signature hashes this exact string (see signFavoriteRequest).
    const payloadStr = JSON.stringify({ device_id: getDeviceId(), adv_id: id })
    const body = await apiPost<T>(url, payloadStr, signFavoriteRequest(url, payloadStr))
    // This API returns HTTP 200 even on failure — surface the in-body error so
    // callers can tell the user *why* (e.g. 422 "No Records Found", 401).
    if (body?.error || (body?.status != null && body.status !== 200)) {
      throw new ApiError(body.status ?? 200, `favorite_${action}_failed`, body.error?.message_en)
    }
    return body
  }
}

export const reelsSource: ReelsSource = new HttpReelsSource()

// Exact shapes returned by the Reels Feed API contract (v1).
// These mirror the backend JSON 1:1 — the mappers (adapters) translate them
// into the app's Listing model so the UI never depends on the wire format.

export type VideoDTO = {
  url: string
  aspect_ratio?: string
  duration_ms?: number
  poster?: string | null
}

export type SellerDTO = {
  id: number
  name: string
  verified?: boolean
  // TODO(contract): not in the FeedItem example — only listed in the field
  // mapping (derived from the seller's category). Confirm it ships on the feed;
  // falls back to district today.
  category_label?: string
}

// Per-viewer wishlist state on a feed item. `is_wishlist` reflects whether the
// requesting user (see identity sent on the feed request) has wishlisted it.
// TODO(backend): not populated yet — the feed still returns is_wishlist=false and
// a null count regardless of the viewer. Frontend is ready for when it lands.
export type StatsDTO = {
  views?: number
  wishlist_count?: number | null
  is_wishlist?: boolean
}

// Seller contact on a feed item. `phone` can hold several numbers separated by
// commas (e.g. "96560666988,96566661615").
export type ContactDTO = {
  phone?: string
}

export type FeedItemDTO = {
  id: string
  title: string
  price: string
  currency: string
  category_id?: string
  video: VideoDTO
  seller: SellerDTO
  contact?: ContactDTO
  stats: StatsDTO
  district?: string
  posted_label?: string
  // Legacy top-level phone kept as a fallback; the live feed ships the number
  // nested under `contact.phone`.
  phone?: string
  slug?: string
}

export type PagingDTO = {
  next_cursor: string | null
  has_more: boolean
  limit: number
}

export type FeedResponseDTO = {
  data: {
    items: FeedItemDTO[]
    paging: PagingDTO
  }
}

// ----- Detail endpoint (live AdvertisementResource) — only the fields we use -----

export type DetailTextDTO = {
  original?: string
  translated?: string
}

export type DetailUserDTO = {
  user_id: number
  name?: string
  image?: string | null
  phone?: string
  is_verified?: boolean
}

export type DetailCategoryDTO = { id: number; name_en?: string; name_ar?: string }
export type DetailDistrictDTO = { id: number; name_en?: string; name_ar?: string }

export type ReelDetailDTO = {
  id: string
  title: DetailTextDTO
  description?: DetailTextDTO
  price: string | number
  ad_asking_price?: string | number
  video_url?: string
  contact_no?: string
  date_published?: string
  categories?: DetailCategoryDTO[]
  districts?: DetailDistrictDTO[]
  district_full_path_en?: string[]
  user?: DetailUserDTO
}

export type DetailResponseDTO = { data: ReelDetailDTO }

export type ApiErrorDTO = { error: string }

// ----- Favorites (wishlist) writes — Favorites/addFavorite, Favorites/removeFavorite -----
// The services API always answers HTTP 200; the real status + any error live in
// the body. Success wraps the result in `response` (a 1 flag); failure (e.g. 422
// "No Records Found", 401 Unauthorized) carries `error`.
export type FavoriteEnvelopeDTO = {
  status?: number
  error?: { code?: number; message_en?: string; message_ar?: string }
}
export type AddFavoriteResponseDTO = FavoriteEnvelopeDTO & { response?: { is_favorite?: number } }
export type RemoveFavoriteResponseDTO = FavoriteEnvelopeDTO & { response?: { is_removed?: number } }

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

export type StatsDTO = {
  views?: number
  // TODO(contract): the FeedItem example used is_favorite/fav_count, but the
  // field-mapping table says the backend only has is_wishlist (bool) and no
  // count today. Standardizing on "wishlist" — confirm a wishlist_count can be
  // exposed (fallback: show views).
  wishlist_count?: number
  is_wishlist?: boolean
}

export type FeedItemDTO = {
  id: string
  title: string
  price: string
  currency: string
  category_id?: string
  video: VideoDTO
  seller: SellerDTO
  stats: StatsDTO
  district?: string
  posted_label?: string
  // TODO(contract): not in the MVP feed example, but available publicly in the
  // 4Sale product. Used by Chat/Call/Share. Confirm whether phone ships on the
  // feed or is read from the detail endpoint; share URL is built from the slug.
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

// Seed data for the mock backend, reshaped from the existing sanitized listings
// into the exact contract DTO shapes. Only used by MSW in dev.

import { listings } from '../features/reels/data/listings'
import type { FeedItemDTO, ReelDetailDTO } from '../features/reels/api/dto'

const SELLER_ID = 12345
const DEMO_PHONE = '+96596685717'

const slugFor = (l: { title: string; id: string }) =>
  `${l.title.toLowerCase().split(' ').slice(0, 2).join('-').replace(/[^a-z0-9-]/g, '')}-${l.id}`

export const feedItems: FeedItemDTO[] = listings.map((l, i) => ({
  id: l.id,
  title: l.title,
  price: l.price.replace(/,/g, ''), // contract sends a raw number string
  currency: 'KD',
  category_id: '23303',
  video: { url: l.videoUrl, aspect_ratio: '9:16', duration_ms: 16000 + i * 800, poster: null },
  seller: { id: SELLER_ID, name: l.sellerName, verified: l.verified, category_label: l.sellerCat },
  stats: { views: 0, wishlist_count: Number(l.favCount) || 0, is_wishlist: false },
  district: l.location.split(',')[0].trim(),
  posted_label: l.posted,
  phone: DEMO_PHONE,
  slug: slugFor(l),
}))

export const detailsById: Record<string, ReelDetailDTO> = Object.fromEntries(
  listings.map(l => [
    l.id,
    {
      user_adv_id: l.id,
      title: l.title,
      description: l.descFull,
      price: l.price.replace(/,/g, ''),
      currency: 'KD',
      video_url: l.videoUrl,
      phone: DEMO_PHONE,
      user_view_count: 0,
      date_published: l.posted,
      extra_attributes: l.specs.map((s, idx) => ({ id: idx, val: s.v, labels_en: s.k })),
      category: { name: l.sellerCat },
      district: { name: l.location },
      user: {
        user_id: SELLER_ID,
        first_name: l.sellerName,
        is_verified: l.verified,
        listings_count: 31,
        member_since: '2021',
      },
    } satisfies ReelDetailDTO,
  ]),
)

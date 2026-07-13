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
      id: l.id,
      title: { original: l.title },
      description: { original: l.descFull },
      price: l.price.replace(/,/g, ''),
      video_url: l.videoUrl,
      contact_no: DEMO_PHONE,
      date_published: l.posted,
      categories: [{ id: 23303, name_en: l.sellerCat }],
      districts: [{ id: 1, name_en: l.location }],
      district_full_path_en: [l.location],
      user: {
        user_id: SELLER_ID,
        name: l.sellerName,
        phone: DEMO_PHONE,
        is_verified: l.verified,
      },
    } satisfies ReelDetailDTO,
  ]),
)

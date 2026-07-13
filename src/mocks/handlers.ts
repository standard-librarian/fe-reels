// MSW request handlers implementing the Reels Feed API contract against seed data.
// Cursor is an opaque base64 token that encodes the offset of the next batch.

import { http, HttpResponse, delay } from 'msw'
import { detailsById, feedItems } from './seed'

const encodeCursor = (offset: number): string => btoa(JSON.stringify({ o: offset }))

const decodeCursor = (cursor: string | null): number => {
  if (!cursor) return 0
  try {
    const parsed = JSON.parse(atob(cursor))
    return typeof parsed.o === 'number' ? parsed.o : Number.NaN
  } catch {
    return Number.NaN
  }
}

export const handlers = [
  // GET /v1/reels/feed?cursor&limit — cursor-paginated feed
  http.get('*/v1/reels/feed', async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 10))
    const offset = decodeCursor(url.searchParams.get('cursor'))
    if (Number.isNaN(offset)) {
      return HttpResponse.json({ error: 'invalid_cursor' }, { status: 400 })
    }
    const items = feedItems.slice(offset, offset + limit)
    const nextOffset = offset + items.length
    const hasMore = nextOffset < feedItems.length
    return HttpResponse.json({
      data: {
        items,
        paging: {
          next_cursor: hasMore ? encodeCursor(nextOffset) : null,
          has_more: hasMore,
          limit,
        },
      },
    })
  }),

  // GET /v1/reels/feed/:id — full detail
  http.get('*/v1/reels/feed/:id', async ({ params }) => {
    await delay(200)
    const detail = detailsById[String(params.id)]
    if (!detail) return HttpResponse.json({ error: 'not_found' }, { status: 404 })
    return HttpResponse.json({ data: detail })
  }),

  // GET /v2/increment-views/:id — side effect when a reel becomes active
  http.get('*/v2/increment-views/:id', () => HttpResponse.json({ data: { ok: true } })),
]

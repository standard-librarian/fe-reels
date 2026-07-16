import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Heart, HeartOff, Info, MessageCircle, HeartPlus, Phone, Share2, Volume2, VolumeX } from 'lucide-react'
import { DetailsPanel } from '../features/reels/components/DetailsPanel'
import { ListingDetails } from '../features/reels/components/ListingDetails'
import { IconButton } from '../features/reels/components/IconButton'
import { ShareDialog } from '../features/reels/components/ShareDialog'
import { ContactDialog } from '../features/reels/components/ContactDialog'
import { ReelFeed } from '../features/reels/components/ReelFeed'
import type { ReelFeedHandle } from '../features/reels/components/ReelFeed'
import { useReelsFeed } from '../features/reels/hooks/useReelsFeed'
import { useReelDetail } from '../features/reels/hooks/useReelDetail'
import { reelsSource } from '../features/reels/api/reelsSource'
import { ApiError } from '../features/reels/api/httpClient'
import { sendReelEvents, wishlistEvent } from '../features/reels/api/events'

const PREFETCH_REMAINING_REELS = 3

export function App() {
  const { listings, loading, error, loadMore, retry } = useReelsFeed()
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [contact, setContact] = useState<'whatsapp' | 'call' | null>(null)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set())
  const [wishlistPending, setWishlistPending] = useState<Set<string>>(() => new Set())
  const [wishlistToast, setWishlistToast] = useState(false)
  const [wishlistError, setWishlistError] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const errorTimer = useRef<number | undefined>(undefined)
  const feedRef = useRef<ReelFeedHandle>(null)
  const justFavorited = useRef<string | null>(null)
  // Listings we've already seeded wishlist state from, so re-fetches / pagination
  // never re-apply the server flag over a user's in-session toggle.
  const hydratedIds = useRef<Set<string>>(new Set())

  const safeIndex = listings.length ? Math.min(index, listings.length - 1) : 0
  const listing = listings[safeIndex]
  const { detail } = useReelDetail(detailsOpen && listing ? listing.id : null)

  // The feed has ends: stop at them rather than wrapping. Wrapping would fling a
  // viewer on the first reel to the last one, which is never what they meant.
  const navigate = useCallback((direction: number) => {
    if (!listings.length) return
    const next = safeIndex + direction
    if (next < 0 || next >= listings.length) return
    feedRef.current?.scrollToReel(next)
  }, [safeIndex, listings.length])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') navigate(1)
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') navigate(-1)
      if (event.key.toLowerCase() === 'm') setMuted(current => !current)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  // Seed the wishlist from the feed's per-viewer is_wishlist flag so favorites
  // survive reload. Each listing is seeded once (tracked in hydratedIds) — after
  // that the local Set is authoritative and won't be overwritten by re-fetches.
  useEffect(() => {
    const seed: string[] = []
    for (const item of listings) {
      if (hydratedIds.current.has(item.id)) continue
      hydratedIds.current.add(item.id)
      if (item.wishlisted) seed.push(item.id)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local state from async feed data; hydratedIds guards against re-runs so there's no cascade
    if (seed.length) setWishlist(current => new Set([...current, ...seed]))
  }, [listings])

  const flipWishlist = (id: string) => setWishlist(current => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  // Three states: idle → loading (spinner) → wishlist/idle. The heart shows a
  // spinner while the request is in flight and only turns red once the server
  // confirms — so a failure never flashes red then reverts. On success we flip +
  // toast + fire the event; on failure we show a centered error message.
  const toggleWishlist = async (id: string) => {
    if (wishlistPending.has(id)) return // ignore taps while one is in flight
    const wasWishlisted = wishlist.has(id)
    setWishlistError(null)
    window.clearTimeout(errorTimer.current)
    setWishlistPending(current => new Set(current).add(id))
    try {
      const ok = wasWishlisted ? await reelsSource.removeFavorite(id) : await reelsSource.addFavorite(id)
      if (!ok) throw new Error('favorite_not_confirmed')
      flipWishlist(id) // commit only now that the server confirmed
      if (!wasWishlisted) {
        setWishlistToast(true)
        window.clearTimeout(toastTimer.current)
        toastTimer.current = window.setTimeout(() => setWishlistToast(false), 1400)
      }
      sendReelEvents([wishlistEvent(id, safeIndex, !wasWishlisted)])
    } catch (err) {
      const message = err instanceof ApiError && err.status === 401
        ? 'Please sign in to use your wishlist.'
        : wasWishlisted
          ? "Couldn't remove from wishlist. Please try again."
          : "Couldn't add to wishlist. Please try again."
      setWishlistError(message)
      window.clearTimeout(errorTimer.current)
      errorTimer.current = window.setTimeout(() => setWishlistError(null), 2600)
    } finally {
      setWishlistPending(current => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  const handleIndexChange = useCallback((idx: number) => {
    setIndex(idx)
    setDetailsOpen(false)
    setDescriptionExpanded(false)
    justFavorited.current = null
    if (idx >= listings.length - PREFETCH_REMAINING_REELS) loadMore()
  }, [listings.length, loadMore])

  // Loading / error states
  if (loading && !listings.length) {
    return <main className="relative w-full h-dvh grid place-items-center bg-dark-bg text-white/70 text-sm font-semibold">Loading reels…</main>
  }
  if (error && !listings.length) {
    return <main className="relative w-full h-dvh flex flex-col items-center justify-center gap-3.5 bg-dark-bg text-white/70 text-sm font-semibold text-center px-6">
      <p>Couldn't load the feed.</p>
      <button className="px-[18px] py-2.5 rounded-full border border-white/20 bg-white/10 text-white font-bold" onClick={retry}>Try again</button>
    </main>
  }
  if (!listing) {
    return <main className="relative w-full h-dvh grid place-items-center bg-dark-bg text-white/70 text-sm font-semibold">No reels yet.</main>
  }

  const shownListing = detail ?? listing

  return <main className={`reels-webview relative w-full h-dvh overflow-hidden bg-dark-bg ${detailsOpen ? 'reels-webview--details' : ''}`}>
    <section className="reels-player absolute inset-0 overflow-hidden bg-dark-bg grid place-items-center">
      <ReelFeed
        ref={feedRef}
        listings={listings}
        muted={muted}
        detailsOpen={detailsOpen}
        onMute={() => setMuted(current => !current)}
        onIndexChange={handleIndexChange}
      />
      <div className="stage-chrome absolute inset-0 pointer-events-none">
        <div className="action-rail absolute right-3 bottom-[max(20px,calc(env(safe-area-inset-bottom)+12px))] z-6 flex flex-col gap-3 pointer-events-auto">
          <IconButton className="action--rail-mute flex" icon={muted ? VolumeX : Volume2} label={muted ? 'Sound' : 'Mute'} onClick={() => setMuted(current => !current)} />
          <IconButton icon={wishlist.has(listing.id) ? Heart : HeartPlus} label="Wishlist" active={wishlist.has(listing.id)} pending={wishlistPending.has(listing.id)} onClick={() => toggleWishlist(listing.id)} />
          <IconButton icon={MessageCircle} label="Chat" onClick={() => setContact('whatsapp')} />
          <IconButton icon={Share2} label="Share" onClick={() => setShareOpen(true)} />
          <IconButton icon={Phone} label="Call" primary onClick={() => setContact('call')} />
        </div>
        {!detailsOpen && <button className="view-details absolute left-1/2 bottom-[max(20px,calc(env(safe-area-inset-bottom)+12px))] -translate-x-1/2 z-6 h-[42px] flex items-center gap-2 px-[22px] border-0 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-brand-text text-[13px] font-bold whitespace-nowrap transition-[transform,box-shadow] duration-[160ms] ease-out pointer-events-auto active:scale-[0.96] active:shadow-[0_4px_14px_rgba(0,0,0,0.2)] [&_svg]:w-[18px] [&_svg]:text-brand-primary" onClick={() => setDetailsOpen(true)}>
          <Info /> View details
        </button>}
        {detailsOpen && <div className="sheet absolute left-0 right-0 bottom-0 top-[12vh] z-8 flex flex-col rounded-t-[20px] bg-white shadow-[0_-12px_34px_rgba(0,0,0,0.22)] overflow-hidden pointer-events-auto animate-[sheet-up_0.34s_cubic-bezier(0.22,1,0.36,1)_both] [&_.ld-wishlist]:hidden [&_.ld-share]:hidden">
          <div className="w-11 h-[5px] mx-auto mt-2.5 mb-1 rounded-full bg-[#e1e5ec] shrink-0" />
          <button className="absolute top-3.5 right-4 w-8 h-8 grid place-items-center border-0 rounded-full bg-brand-section text-brand-muted z-2 [&_svg]:w-5" onClick={() => setDetailsOpen(false)} aria-label="Close details"><ChevronDown /></button>
          <div className="flex-1 overflow-y-auto px-[18px] py-2.5 pb-[calc(26px+env(safe-area-inset-bottom))] noscroll">
            <ListingDetails listing={shownListing} expanded={descriptionExpanded} wishlisted={wishlist.has(listing.id)} onExpand={() => setDescriptionExpanded(current => !current)} onWishlist={() => toggleWishlist(listing.id)} onChat={() => setContact('whatsapp')} onCall={() => setContact('call')} onShare={() => setShareOpen(true)} />
          </div>
        </div>}
      </div>
      <nav className="reel-nav absolute right-3.5 top-1/2 -translate-y-1/2 z-6 hidden flex-col items-center gap-3 text-white" aria-label="Reel navigation">
        <button className="w-[52px] h-[52px] grid place-items-center border border-white/19 rounded-full bg-black/34 backdrop-blur-[8px] text-white transition-transform duration-[160ms] ease-out active:scale-[0.92] [&_svg]:w-[22px] disabled:opacity-30 disabled:pointer-events-none" onClick={() => navigate(-1)} disabled={safeIndex === 0} aria-label="Previous reel"><ChevronUp /></button>
        <button className="w-[52px] h-[52px] grid place-items-center border border-white/19 rounded-full bg-black/34 backdrop-blur-[8px] text-white transition-transform duration-[160ms] ease-out active:scale-[0.92] [&_svg]:w-[22px] disabled:opacity-30 disabled:pointer-events-none" onClick={() => navigate(1)} disabled={safeIndex >= listings.length - 1} aria-label="Next reel"><ChevronDown /></button>
      </nav>
    </section>

    {detailsOpen ? <DetailsPanel listing={shownListing} expanded={descriptionExpanded} wishlisted={wishlist.has(listing.id)} onExpand={() => setDescriptionExpanded(current => !current)} onClose={() => setDetailsOpen(false)} onChat={() => setContact('whatsapp')} onCall={() => setContact('call')} onShare={() => setShareOpen(true)} onWishlist={() => toggleWishlist(listing.id)} /> : null}

    {/* Toast: a full-width flex row centers the pill horizontally, so the pill's
        own drop-in transform can't knock it off-center (which pushed it to the left). */}
    {(wishlistToast || wishlistError) && <div className="absolute inset-x-0 top-[max(40px,calc(env(safe-area-inset-top)+8px))] z-20 flex justify-center px-4 pointer-events-none">
      {wishlistError
        ? <div className="flex items-center gap-2.5 py-3 px-[18px] rounded-full bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] text-[13px] font-bold whitespace-nowrap animate-[toast-down_0.3s_cubic-bezier(0.22,1,0.36,1)_both] pointer-events-auto [&_svg]:text-[#ef4444]" role="alert" aria-live="assertive">
            <HeartOff size={18} />
            <span>{wishlistError}</span>
          </div>
        : <div className="flex items-center gap-2.5 py-3 px-[18px] rounded-full bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] text-[13px] font-bold whitespace-nowrap animate-[toast-down_0.3s_cubic-bezier(0.22,1,0.36,1)_both] pointer-events-auto [&_svg]:text-wishlist [&_svg]:fill-wishlist" role="status" aria-live="polite">
            <Heart size={18} />
            <span>Added to Wishlist</span>
          </div>}
    </div>}

    {shareOpen ? <ShareDialog id={listing.id} onClose={() => setShareOpen(false)} /> : null}

    {contact ? <ContactDialog variant={contact} phone={listing.phone ?? ''} onClose={() => setContact(null)} /> : null}
  </main>
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Heart, Info, MessageCircle, HeartPlus, Phone, Share2, Volume2, VolumeX } from 'lucide-react'
import { DetailsPanel } from '../features/reels/components/DetailsPanel'
import { ListingDetails } from '../features/reels/components/ListingDetails'
import { IconButton } from '../features/reels/components/IconButton'
import { ShareDialog } from '../features/reels/components/ShareDialog'
import { ReelFeed } from '../features/reels/components/ReelFeed'
import type { ReelFeedHandle } from '../features/reels/components/ReelFeed'
import { listings } from '../features/reels/data/listings'

export function App() {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())
  const [wishlistToast, setWishlistToast] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)
  const feedRef = useRef<ReelFeedHandle>(null)
  const listing = listings[index]

  const navigate = useCallback((direction: number) => {
    const next = (index + direction + listings.length) % listings.length
    feedRef.current?.scrollToReel(next)
  }, [index])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') navigate(1)
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') navigate(-1)
      if (event.key.toLowerCase() === 'm') setMuted(current => !current)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  const toggleFavorite = () => {
    const wasFavorited = favorites.has(listing.id)
    setFavorites(current => {
      const next = new Set(current)
      if (next.has(listing.id)) next.delete(listing.id)
      else next.add(listing.id)
      return next
    })
    if (!wasFavorited) {
      setWishlistToast(true)
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setWishlistToast(false), 3000)
    } else {
      setWishlistToast(false)
      window.clearTimeout(toastTimer.current)
    }
  }

  const handleIndexChange = useCallback((idx: number) => {
    setIndex(idx)
    setDetailsOpen(false)
    setDescriptionExpanded(false)
  }, [])

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
          <IconButton icon={favorites.has(listing.id) ? Heart : HeartPlus} label="Wishlist" active={favorites.has(listing.id)} onClick={toggleFavorite} />
          <IconButton icon={MessageCircle} label="Chat" />
          <IconButton icon={Share2} label="Share" onClick={() => setShareOpen(true)} />
          <IconButton icon={Phone} label="Call" primary />
        </div>
        {!detailsOpen && <button className="view-details absolute left-1/2 bottom-[max(20px,calc(env(safe-area-inset-bottom)+12px))] -translate-x-1/2 z-6 h-[42px] flex items-center gap-2 px-[22px] border-0 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-brand-text text-[13px] font-bold whitespace-nowrap transition-[transform,box-shadow] duration-[160ms] ease-out pointer-events-auto active:scale-[0.96] active:shadow-[0_4px_14px_rgba(0,0,0,0.2)] [&_svg]:w-[18px] [&_svg]:text-brand-primary" onClick={() => setDetailsOpen(true)}>
          <Info /> View details
        </button>}
        {detailsOpen && <div className="sheet absolute left-0 right-0 bottom-0 top-[12vh] z-8 flex flex-col rounded-t-[20px] bg-white shadow-[0_-12px_34px_rgba(0,0,0,0.22)] overflow-hidden pointer-events-auto animate-[sheet-up_0.34s_cubic-bezier(0.22,1,0.36,1)_both] [&_.ld-fav]:hidden [&_.ld-share]:hidden">
          <div className="w-11 h-[5px] mx-auto mt-2.5 mb-1 rounded-full bg-[#e1e5ec] shrink-0" />
          <button className="absolute top-3.5 right-4 w-8 h-8 grid place-items-center border-0 rounded-full bg-brand-section text-brand-muted z-2 [&_svg]:w-5" onClick={() => setDetailsOpen(false)} aria-label="Close details"><ChevronDown /></button>
          <div className="flex-1 overflow-y-auto px-[18px] py-2.5 pb-[calc(26px+env(safe-area-inset-bottom))] noscroll">
            <ListingDetails listing={listing} expanded={descriptionExpanded} favorite={favorites.has(listing.id)} onExpand={() => setDescriptionExpanded(current => !current)} onFavorite={toggleFavorite} onShare={() => setShareOpen(true)} />
          </div>
        </div>}
      </div>
      <nav className="reel-nav absolute right-3.5 top-1/2 -translate-y-1/2 z-6 hidden flex-col items-center gap-3 text-white" aria-label="Reel navigation">
        <button className="w-[52px] h-[52px] grid place-items-center border border-white/19 rounded-full bg-black/34 backdrop-blur-[8px] text-white transition-transform duration-[160ms] ease-out active:scale-[0.92] [&_svg]:w-[22px]" onClick={() => navigate(-1)} aria-label="Previous reel"><ChevronUp /></button>
        <button className="w-[52px] h-[52px] grid place-items-center border border-white/19 rounded-full bg-black/34 backdrop-blur-[8px] text-white transition-transform duration-[160ms] ease-out active:scale-[0.92] [&_svg]:w-[22px]" onClick={() => navigate(1)} aria-label="Next reel"><ChevronDown /></button>
      </nav>
    </section>

    {detailsOpen ? <DetailsPanel listing={listing} expanded={descriptionExpanded} favorite={favorites.has(listing.id)} onExpand={() => setDescriptionExpanded(current => !current)} onClose={() => setDetailsOpen(false)} onShare={() => setShareOpen(true)} onFavorite={toggleFavorite} /> : null}

    {wishlistToast && <div className="absolute left-1/2 top-[max(40px,calc(env(safe-area-inset-top)+8px))] z-20 flex items-center gap-2.5 py-3 px-[18px] rounded-full bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] text-[13px] font-bold whitespace-nowrap animate-[toast-down_0.3s_cubic-bezier(0.22,1,0.36,1)_both] pointer-events-auto [&_svg]:text-fav [&_svg]:fill-fav" role="status" aria-live="polite">
      <Heart size={18} />
      <span>Added to Wishlist</span>
    </div>}

    {shareOpen ? <ShareDialog id={listing.id} onClose={() => setShareOpen(false)} /> : null}
  </main>
}

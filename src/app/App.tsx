import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Heart, Info, MessageCircle, Phone, Share2 } from 'lucide-react'
import { DetailsPanel } from '../features/reels/components/DetailsPanel'
import { ListingDetails } from '../features/reels/components/ListingDetails'
import { IconButton } from '../features/reels/components/IconButton'
import { ShareDialog } from '../features/reels/components/ShareDialog'
import { VideoStage } from '../features/reels/components/VideoStage'
import { VideoPreloader } from '../features/reels/components/VideoPreloader'
import { listings } from '../features/reels/data/listings'

export function App() {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())
  const [navigationDirection, setNavigationDirection] = useState(1)
  const [inputLockedUntil, setInputLockedUntil] = useState(0)
  const listing = listings[index]
  const upcomingVideoUrls = [1, 2].map(offset => listings[(index + offset) % listings.length].videoUrl)

  const navigate = useCallback((direction: number) => {
    const now = performance.now()
    if (now < inputLockedUntil) return
    setInputLockedUntil(now + 550)
    setNavigationDirection(direction)
    setIndex(current => (current + direction + listings.length) % listings.length)
    setDetailsOpen(false)
    setDescriptionExpanded(false)
  }, [inputLockedUntil])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') navigate(1)
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') navigate(-1)
      if (event.key.toLowerCase() === 'm') setMuted(current => !current)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  const toggleFavorite = () => setFavorites(current => {
    const next = new Set(current)
    if (next.has(listing.id)) next.delete(listing.id)
    else next.add(listing.id)
    return next
  })

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }

  const actions = <>
    <IconButton icon={Heart} label={listing.favCount} active={favorites.has(listing.id)} onClick={toggleFavorite}/>
    <IconButton icon={Share2} label="Share" onClick={() => setShareOpen(true)}/>
    <IconButton icon={MessageCircle} label="Chat"/>
    <IconButton icon={Phone} label="Call" primary/>
  </>

  const video = <VideoStage
    key={listing.id}
    listing={listing}
    muted={muted}
    enterDirection={navigationDirection}
    inputLockedUntil={inputLockedUntil}
    index={index}
    total={listings.length}
    onMute={() => setMuted(current => !current)}
    onFullscreen={toggleFullscreen}
    onNavigate={navigate}
  />

  return <main className={`reels-webview ${detailsOpen ? 'reels-webview--details' : ''}`}>
    <VideoPreloader urls={upcomingVideoUrls}/>
    <section className="reels-player" aria-label="Video listings">
      {video}
      <div className="action-rail">{actions}</div>
      <nav className="reel-nav" aria-label="Reel navigation">
        <button onClick={() => navigate(-1)} aria-label="Previous reel"><ChevronUp/></button>
        <span>{index + 1} / {listings.length}</span>
        <button onClick={() => navigate(1)} aria-label="Next reel"><ChevronDown/></button>
      </nav>
      {!detailsOpen ? <button className="view-details" onClick={() => setDetailsOpen(true)}>
        <Info/> View details <span className="view-details__dot">·</span> <b>KD {listing.price}</b>
      </button> : <div className="sheet">
        <div className="sheet__grip"/>
        <button className="sheet__close" onClick={() => setDetailsOpen(false)} aria-label="Close details"><ChevronDown/></button>
        <div className="sheet__scroll noscroll">
          <ListingDetails listing={listing} expanded={descriptionExpanded} favorite={favorites.has(listing.id)} onExpand={() => setDescriptionExpanded(current => !current)} onFavorite={toggleFavorite} onShare={() => setShareOpen(true)}/>
        </div>
      </div>}
    </section>

    {detailsOpen ? <DetailsPanel listing={listing} expanded={descriptionExpanded} favorite={favorites.has(listing.id)} onExpand={() => setDescriptionExpanded(current => !current)} onClose={() => setDetailsOpen(false)} onShare={() => setShareOpen(true)} onFavorite={toggleFavorite}/> : null}

    {shareOpen ? <ShareDialog id={listing.id} onClose={() => setShareOpen(false)}/> : null}
  </main>
}

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Heart, MessageCircle, Phone, Share2 } from 'lucide-react'
import { Details } from '../features/reels/components/Details'
import { IconButton } from '../features/reels/components/IconButton'
import { ShareDialog } from '../features/reels/components/ShareDialog'
import { VideoStage } from '../features/reels/components/VideoStage'
import { listings, related } from '../features/reels/data/listings'

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
    onMute={() => setMuted(current => !current)}
    onNavigate={navigate}
  />

  return <main className="reels-webview">
    <section className="reels-player" aria-label="Video listings">
      {video}
      <span className="index">{index + 1} / {listings.length}</span>
      <div className="action-rail">{actions}</div>
      {!detailsOpen ? <button className="view-details" onClick={() => setDetailsOpen(true)}>
        <ChevronUp/> View details · <b>KD {listing.price}</b>
      </button> : <div className="sheet">
        <button className="sheet__close" onClick={() => setDetailsOpen(false)} aria-label="Close details"><ChevronDown/></button>
        <Details listing={listing} expanded={descriptionExpanded} onExpand={() => setDescriptionExpanded(current => !current)} onShare={() => setShareOpen(true)} favorite={favorites.has(listing.id)} onFavorite={toggleFavorite}/>
      </div>}
    </section>

    <aside className="reels-details">
      <Details listing={listing} expanded={descriptionExpanded} onExpand={() => setDescriptionExpanded(current => !current)} onShare={() => setShareOpen(true)} favorite={favorites.has(listing.id)} onFavorite={toggleFavorite}/>
      <h2 className="related-title">You may also like</h2>
      <div className="related">{related.map((title, itemIndex) => <article key={title}>
        <div/><small>{title}</small><b>KD {(10900 + itemIndex * 850).toLocaleString()}</b>
      </article>)}</div>
    </aside>

    {shareOpen ? <ShareDialog id={listing.id} onClose={() => setShareOpen(false)}/> : null}
  </main>
}

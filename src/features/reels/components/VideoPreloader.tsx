import { useEffect, useRef } from 'react'

const WARM_SECONDS = 3

function PreloadVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const warmBuffer = () => {
      if (video.currentTime >= WARM_SECONDS) {
        video.pause()
        return
      }
      void video.play().catch(() => {
        // preload="auto" still warms the browser cache when autoplay is restricted.
      })
    }
    const stopAtWarmBoundary = () => {
      if (video.currentTime >= WARM_SECONDS) video.pause()
    }

    video.addEventListener('canplay', warmBuffer, { once: true })
    video.addEventListener('timeupdate', stopAtWarmBoundary)
    video.load()

    return () => {
      video.pause()
      video.removeEventListener('canplay', warmBuffer)
      video.removeEventListener('timeupdate', stopAtWarmBoundary)
    }
  }, [src])

  return <video ref={videoRef} className="video-preload" src={src} preload="auto" muted playsInline aria-hidden="true" tabIndex={-1}/>
}

export function VideoPreloader({ urls }: { urls: string[] }) {
  return <div className="video-preload-pool" aria-hidden="true">
    {urls.map(url => <PreloadVideo key={url} src={url}/>)}
  </div>
}

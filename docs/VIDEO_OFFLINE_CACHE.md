# Reel Video Cache and Low-Network Playback

Status: proposed; no implementation is included in this repository.

## Why playback can still pause

The current `VideoPreloader` warms the next two URLs using HTML video elements. This improves the common case but cannot guarantee buffered playback because:

- `preload="auto"` is a browser hint, and mobile browsers may ignore it under data-saving, memory, or battery pressure.
- MP4 playback uses HTTP range requests. A browser can evict those partial responses or decide not to reuse them for a new video element.
- A cold CDN connection still pays DNS, TLS, and time-to-first-byte latency.
- The ambient blurred copy and foreground copy use the same URL but require two video decoders. The network response is generally shared, while decode and memory pressure can still delay playback on low-end devices.
- Browser HTTP cache quotas and eviction are not controlled by application code.

## Required user experience

When a user is watching reel `N`, the first seconds of `N+1` and `N+2` should be locally available. A cached reel should start without network access. If neither cache nor network can provide playable media, the current frame should remain visible until playback can continue; the UI should not flash an empty loading screen.

## Recommended architecture

Use a native, bounded media cache exposed to the webview through a small bridge. The web layer decides which URLs are important; the native layer owns downloading, persistence, range handling, quotas, and eviction.

```text
Reel feed
  -> MediaCacheBridge.prefetch(next two URLs, first 3-5 seconds)
  -> native download/cache manager
  -> bounded on-device LRU cache
  -> MediaCacheBridge.resolve(current URL)
  -> local custom-scheme URL when cached, CDN URL otherwise
  -> video element
```

### Web API contract

Expose the following bridge methods on both iOS and Android:

```ts
type CachedMedia = {
  sourceUrl: string
  playbackUrl: string
  cachedBytes: number
  complete: boolean
}

interface MediaCacheBridge {
  prefetch(items: Array<{ url: string; warmSeconds: number }>): Promise<void>
  resolve(url: string): Promise<CachedMedia>
  cancel(url: string): Promise<void>
  stats(): Promise<{ usedBytes: number; maxBytes: number; entries: number }>
}
```

The React application should keep its current two-item rolling window. When the index changes, cancel items that leave the window, request `N+1` and `N+2`, and resolve the active URL before mounting the foreground player.

### Native cache policy

- Start with a 150 MB LRU budget, remotely configurable.
- Key entries by canonical media URL plus an asset version or ETag.
- Cache at least the byte ranges required for 3-5 seconds of playback; allow a fully watched video to remain cached when space permits.
- Download atomically and never expose a partially written local file as complete.
- Deduplicate concurrent requests for the same URL.
- Respect OS low-storage signals, user data-saver settings, and an application-level “Wi-Fi only prefetch” flag.
- Remove expired content and enforce the budget on app startup and after each completed download.
- Record cache hit, miss, eviction, download duration, buffered seconds, and playback-start latency without recording user contact or listing content.

### Platform notes

#### iOS

Use `URLSession` for progressive MP4 range downloads and a `WKURLSchemeHandler` (for example, `foursale-media://`) to serve cached bytes to the webview. If media delivery moves to HLS, prefer `AVAssetDownloadURLSession`, which handles segment persistence more naturally.

#### Android

Use Media3/ExoPlayer `SimpleCache` with an LRU evictor and a cache-backed data source. Expose cached media to the webview through an app-controlled HTTPS/custom-scheme handler. Do not return unrestricted `file://` paths.

## Delivery-format recommendation

Move reel delivery from single progressive MP4 files to HLS with short, independently cacheable segments and multiple bitrates. HLS reduces the amount required before playback, adapts to slow connections, and makes “cache the first few seconds” an explicit segment operation.

Keep progressive MP4 support during migration. The native cache is still valuable for MP4, but range boundaries and browser reuse are less predictable than segmented media.

## Browser-only fallback

For environments outside the native webview, use a service worker only as a best-effort fallback:

- Cache manifests, posters, and HLS initialization/first media segments.
- If MP4 remains, use a range-aware service-worker strategy; ordinary Cache Storage handling of `206 Partial Content` is insufficient.
- Avoid storing large video blobs in IndexedDB because it increases memory copies, quota failures, and main-thread complexity.
- Keep the current HTML video preloader when service workers or persistent storage are unavailable.

Browser caching must not be presented as equivalent to the native cache because storage persistence and eviction remain browser-controlled.

## Playback behavior

1. Keep the current reel mounted until the next reel reports a playable frame.
2. Resolve the next URL through the bridge before creating its visible player.
3. Begin the transition only after `loadeddata` or a platform-equivalent playable signal.
4. On failure, retry the CDN URL once while retaining the previous frame.
5. Do not autoplay more than the active reel and the two muted warm-up reels.
6. Pause and release decoders for reels outside the three-item window.

## Rejected alternatives

- **Rely only on `preload="auto"`:** simple, but browsers may ignore or evict the buffered data.
- **Cache every reel:** creates uncontrolled storage and mobile-data usage for an infinite feed.
- **Store full MP4 blobs in IndexedDB:** portable in theory, but inefficient for large media and unreliable under browser quotas.
- **Ship videos inside the application bundle:** guarantees availability only for static demo content and cannot support a live listing feed.
- **Show a synthetic animation while media loads:** hides symptoms without improving playback and misrepresents media readiness.

## Acceptance criteria

- The next two reels are scheduled for caching whenever the active index changes.
- On a throttled 750 Kbps connection, a prefetched next reel displays its first frame within 250 ms of navigation in at least 95% of test runs.
- A fully cached reel starts and plays its cached portion in airplane mode.
- Cache usage never exceeds the configured budget by more than one in-flight asset.
- Repeated requests for one URL share a single download.
- Eviction follows LRU order and never removes the currently playing reel.
- The app keeps the previous frame visible when the next reel is not playable.
- Metrics distinguish cache hits, browser/CDN hits, and failures.
- iOS and Android behavior is covered by slow-network, offline, low-storage, background/foreground, and data-saver tests.

## Likely changes

- The cache budget and warm duration should remain remote configuration rather than constants in React.
- A future HLS migration should change the native downloader/resolver, not the reel component contract.
- Feed ranking may alter which items are “next”; the rolling-window caller must cancel stale prefetch work.
- Signed or expiring media URLs will require cache keys based on stable asset identity rather than the complete query string.

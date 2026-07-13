import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/global.css'

// The live staging API is the normal development path. Opt into MSW only when
// developing the UI without a network connection. The dynamic import keeps
// mock code out of production bundles.
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCK !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

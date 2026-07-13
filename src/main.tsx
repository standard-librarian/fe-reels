import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/global.css'

// In dev, start the MSW mock backend (unless explicitly disabled) so the app can
// run against the API contract without a live server. The dynamic import keeps
// the mocks out of production bundles.
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCK === 'false') return
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

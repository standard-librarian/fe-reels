import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AuthProvider } from './context/AuthContext'
import { bootstrapAmplitude } from './features/reels/analytics'
import './styles/global.css'

// Initialise Amplitude once, before the app renders. No-ops without an API key.
bootstrapAmplitude()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

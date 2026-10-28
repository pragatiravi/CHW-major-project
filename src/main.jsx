import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-kannada/400.css'
import '@fontsource/noto-sans-kannada/600.css'
import '@fontsource/noto-sans-kannada/700.css'
import '@fontsource/noto-sans-devanagari/400.css'
import '@fontsource/noto-sans-devanagari/600.css'
import '@fontsource/noto-sans-devanagari/700.css'
import './index.css'
import App from './App.jsx'
import { initPWA } from './registerServiceWorker'

initPWA();

document.title = 'CHW Healthcare Toolkit — Intelligent Chronic Care Platform'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

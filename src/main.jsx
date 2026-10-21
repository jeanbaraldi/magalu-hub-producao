import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { repassarCodigoAoPainel } from './lib/retornoOAuth'

// Aba de login aberta pelo painel dentro do Hub: devolve o code e fecha, sem montar o app.
if (!repassarCodigoAoPainel(window)) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

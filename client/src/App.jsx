import { useEffect, useState } from 'react'
import './App.css'
import { LiveCall } from './components/LiveCall'

function Landing({ onStart }) {
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState(null)

  async function handleStart() {
    setRequesting(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
        audio: true,
      })
      onStart(stream)
    } catch (reason) {
      setError(
        reason.name === 'NotAllowedError'
          ? 'Necesitamos permiso de cámara y micrófono para iniciar la simulación.'
          : `No se pudo acceder a tus dispositivos: ${reason.message}`,
      )
    } finally {
      setRequesting(false)
    }
  }

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <strong>Interview Reviewer</strong>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">ENTREVISTA REVIEWER / BETA</p>
        <h1>Tu próxima entrevista, en modo práctica.</h1>
        <p className="hero-copy">
          Una sala de entrevista simulada para puestos de sistemas, QA y soporte. Practica frente
          a cámara y recibe señales claras sobre tu expresión y mirada.
        </p>
        <button type="button" className="hero-cta" onClick={handleStart} disabled={requesting}>
          {requesting ? 'Solicitando permisos…' : 'Iniciar entrevista'}
        </button>
        {error && <p className="landing-error" role="alert">{error}</p>}
        <div className="landing-note"><span /> Cámara y micrófono solo durante la simulación</div>
      </section>
      <div className="landing-preview" aria-hidden="true">
        <div className="preview-top"><span /><span /><span /><b>Interview room</b></div>
        <div className="preview-screen"><span className="preview-avatar">IR</span><small>Entrevistador IA</small></div>
        <div className="preview-self"><span>Tu cámara</span></div>
        <div className="preview-bar"><i /><i /><i /><em /></div>
      </div>
    </main>
  )
}

function Connecting({ navigate }) {
  useEffect(() => {
    const timer = window.setTimeout(() => navigate('/interview/live'), 1800)
    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <main className="connecting-page" aria-live="polite">
      <div className="connecting-card">
        <div className="connecting-orbit" aria-hidden="true">
          <span />
        </div>
        <p className="eyebrow">INTERVIEW REVIEWER</p>
        <h1>Conectando a la llamada</h1>
        <p>Estamos preparando tu sala de entrevista segura.</p>
        <div className="connecting-dots" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </main>
  )
}

function Interview({ navigate, stream }) {
  return <LiveCall initialStream={stream} onExit={() => navigate('/')} />
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [preflightStream, setPreflightStream] = useState(null)

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextPath) {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  if (path === '/interview') return <Connecting navigate={() => navigate('/interview/live')} />
  if (path === '/interview/live') return <Interview navigate={navigate} stream={preflightStream} />
  return <Landing onStart={(stream) => { setPreflightStream(stream); navigate('/interview') }} />
}

export default App

import { useEffect, useState } from 'react'
import './App.css'
import { LiveCall } from './components/LiveCall'

function Landing({ navigate }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <strong>Interview Reviewer</strong>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">SIMULADOR DE ENTREVISTAS TÉCNICAS</p>
        <h1>Practica la entrevista que realmente quieres conseguir.</h1>
        <p className="hero-copy">
          Simula una llamada de entrevista adaptada a tu CV y al puesto que buscas: sistemas,
          QA, soporte o desarrollo. Mejora tus respuestas y tu comunicación frente a cámara.
        </p>
        <button type="button" className="hero-cta" onClick={() => navigate('/interview')}>
          Iniciar entrevista
        </button>
      </section>
      <section className="landing-cards" aria-label="Cómo funciona">
        <article>
          <span>01</span>
          <h2>Sube tu contexto</h2>
          <p>Usa tu CV para preparar una entrevista alineada con tu experiencia.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Simula la llamada</h2>
          <p>Activa cámara y micrófono y practica en una experiencia parecida a una videollamada.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Entiende tu presencia</h2>
          <p>Observa tus expresiones y landmarks faciales mientras respondes.</p>
        </article>
      </section>
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

function Interview({ navigate }) {
  return <LiveCall onExit={() => navigate('/')} />
}

function App() {
  const [path, setPath] = useState(window.location.pathname)

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
  if (path === '/interview/live') return <Interview navigate={navigate} />
  return <Landing navigate={navigate} />
}

export default App

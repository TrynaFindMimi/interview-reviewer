import { useEffect, useState } from 'react'
import './App.css'
import { WebcamRecorder } from './components/WebcamRecorder'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

const MODES = [
  { key: 'record', label: 'Grabar cámara' },
  { key: 'upload', label: 'Subir video' },
]

const METRICS = [
  { key: 'smiles', label: 'Sonrisas' },
  { key: 'eyebrow_raises', label: 'Cejas levantadas' },
  { key: 'blinks', label: 'Parpadeos' },
  { key: 'jaw_opens', label: 'Boca abierta' },
]

function Landing({ navigate }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <strong>Interview Reviewer</strong>
        <button type="button" className="nav-login" onClick={() => navigate('/login')}>
          Iniciar sesión
        </button>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">SIMULADOR DE ENTREVISTAS TÉCNICAS</p>
        <h1>Practica la entrevista que realmente quieres conseguir.</h1>
        <p className="hero-copy">
          Simula una llamada de entrevista adaptada a tu CV y al puesto que buscas: sistemas,
          QA, soporte o desarrollo. Mejora tus respuestas y tu comunicación frente a cámara.
        </p>
        <button type="button" className="hero-cta" onClick={() => navigate('/login')}>
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

function Login({ navigate }) {
  const [email, setEmail] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    navigate('/interview')
  }

  return (
    <main className="auth-page">
      <button type="button" className="back-link" onClick={() => navigate('/')}>
        ← Volver al inicio
      </button>
      <section className="auth-card">
        <p className="eyebrow">ENTREVISTA PERSONALIZADA</p>
        <h1>Prepara tu simulacro</h1>
        <p>Ingresa tu correo para continuar. La configuración de CV y puesto estará disponible en el siguiente paso.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            required
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="hero-cta">Continuar</button>
        </form>
      </section>
    </main>
  )
}

function Interview({ navigate }) {
  const [mode, setMode] = useState('record')
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!file) return
    const form = new FormData()
    form.append('video', file)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: form,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail ?? `Error ${response.status}`)
      }
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(key) {
    setMode(key)
    setFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <main className="app">
      <button type="button" className="back-link interview-back" onClick={() => navigate('/')}>
        ← Salir al inicio
      </button>
      <header>
        <h1>Interview Reviewer</h1>
        <p>Analiza los gestos faciales de una entrevista por Zoom detectados por MediaPipe</p>
      </header>

      <div className="segmented" role="tablist">
        {MODES.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            className={mode === key ? 'active' : ''}
            onClick={() => switchMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'record' ? (
        <WebcamRecorder onRecorded={setFile} />
      ) : (
        <div className="uploader">
          <label className="file-field">
            <span>{file ? file.name : 'Selecciona un video…'}</span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
              onChange={(event) => setFile(event.target.files[0])}
            />
          </label>
        </div>
      )}

      {file && mode === 'record' && (
        <p className="recorded-file">Video listo: <strong>{file.name}</strong></p>
      )}

      <button
        type="button"
        className="analyze"
        onClick={handleSubmit}
        disabled={loading || !file}
      >
        {loading ? 'Analizando…' : 'Analizar video'}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="results">
          <h2>Resultado</h2>
          <div className="metrics">
            {METRICS.map(({ key, label }) => (
              <div className="metric" key={key}>
                <strong>{result[key]}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="presence">
            Presencia facial:{' '}
            <strong>{(result.face_presence * 100).toFixed(1)}%</strong>{' '}
            <small>({result.frames_with_face}/{result.total_frames} frames)</small>
          </p>
        </section>
      )}
    </main>
  )
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

  if (path === '/login') return <Login navigate={navigate} />
  if (path === '/interview') return <Interview navigate={navigate} />
  return <Landing navigate={navigate} />
}

export default App

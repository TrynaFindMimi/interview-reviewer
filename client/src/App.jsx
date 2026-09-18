import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

const METRICS = [
  { key: 'smiles', label: 'Sonrisas' },
  { key: 'eyebrow_raises', label: 'Cejas levantadas' },
  { key: 'blinks', label: 'Parpadeos' },
  { key: 'jaw_opens', label: 'Boca abierta' },
]

function App() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
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

  return (
    <main className="app">
      <header>
        <h1>Interview Reviewer</h1>
        <p>Analiza los gestos faciales de una entrevista detectados por MediaPipe</p>
      </header>

      <form className="uploader" onSubmit={handleSubmit}>
        <label className="file-field">
          <span>{file ? file.name : 'Selecciona un video…'}</span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
            onChange={(event) => setFile(event.target.files[0])}
          />
        </label>
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Analizando…' : 'Analizar video'}
        </button>
      </form>

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

export default App
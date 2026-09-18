import { useEffect, useRef, useState } from 'react'
import {
  AudioMutedOutlined,
  AudioOutlined,
  CloseOutlined,
  PhoneOutlined,
  VideoCameraAddOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { FaceLandmarkOverlay } from '../FaceLandmarkOverlay'

export function LiveCall({ onExit }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [status, setStatus] = useState('Conectando cámara y micrófono…')
  const [error, setError] = useState(null)
  const [face, setFace] = useState({ detected: false, count: 0, expressions: {} })

  const expressionOptions = [
    ['smile', 'Sonriendo'],
    ['brow', 'Atento'],
    ['blink', 'Parpadeando'],
    ['jaw', 'Hablando'],
  ]
  const currentExpression = expressionOptions.reduce(
    (current, [key, label]) => {
      const score = face.expressions[key] ?? 0
      return score > current.score ? { label, score } : current
    },
    { label: 'Neutral', score: 0 },
  )

  useEffect(() => {
    let cancelled = false

    async function connect() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Tu navegador no permite acceder a la cámara. Usa localhost o HTTPS.')
        setStatus('Cámara no disponible')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus('Llamada conectada')
      } catch (reason) {
        setStatus('No se pudo conectar')
        setError(
          reason.name === 'NotAllowedError'
            ? 'Permite el acceso a cámara y micrófono desde el icono de permisos del navegador.'
            : `No se pudo conectar la cámara: ${reason.message}`,
        )
      }
    }

    connect()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  function toggleCamera() {
    const next = !cameraEnabled
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next
    })
    setCameraEnabled(next)
  }

  function toggleMic() {
    const next = !micEnabled
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next
    })
    setMicEnabled(next)
  }

  return (
    <main className="call-page">
      <header className="call-topbar">
        <div className="call-brand"><span className="call-live-dot" /> Interview Reviewer</div>
        <div className="call-status">{status}</div>
        <button type="button" className="call-leave" onClick={onExit} aria-label="Salir de la llamada" title="Salir">
          <CloseOutlined />
        </button>
      </header>

      <section className="call-content">
        <div className="call-grid">
          <article className="call-tile call-interviewer">
            <div className="interviewer-avatar">IR</div>
            <span className="tile-name">Entrevistador IA</span>
            <span className="tile-caption">Simulación de entrevista</span>
          </article>
          <article className="call-tile call-you">
            <video ref={videoRef} autoPlay muted playsInline />
            <FaceLandmarkOverlay videoRef={videoRef} onDetection={setFace} />
            <span className="tile-name">Tú</span>
            <span className="camera-state">{cameraEnabled ? 'Cámara activa' : 'Cámara apagada'}</span>
          </article>
        </div>

        <aside className="call-analysis">
          <p className="analysis-kicker">EXPRESIÓN EN TIEMPO REAL</p>
          <h1>{face.detected ? currentExpression.label : 'Buscando tu rostro…'}</h1>
          <p className="analysis-muted">
            {face.detected ? 'Así te está percibiendo la cámara.' : 'Colócate frente a la cámara para comenzar.'}
          </p>
          <div className={`analysis-placeholder ${face.detected ? 'detected' : ''}`}>
            <span className="analysis-pulse" />
            {face.detected ? `${Math.round(currentExpression.score * 100)}% de intensidad` : 'Esperando detección facial…'}
          </div>
          <div className="expression-list" aria-label="Expresiones detectadas">
            {[
              ['Sonrisa', face.expressions.smile],
              ['Cejas', face.expressions.brow],
              ['Parpadeo', face.expressions.blink],
              ['Boca', face.expressions.jaw],
            ].map(([label, value]) => {
              const percentage = Math.round((value ?? 0) * 100)
              return (
                <div className="expression-row" key={label}>
                  <div><span>{label}</span><strong>{percentage}%</strong></div>
                  <span className="expression-track"><span style={{ width: `${percentage}%` }} /></span>
                </div>
              )
            })}
          </div>
        </aside>
      </section>

      {error && <p className="call-error" role="alert">{error}</p>}

      <footer className="call-controls">
        <button
          type="button"
          className={!micEnabled ? 'control muted' : 'control'}
          onClick={toggleMic}
          aria-label={micEnabled ? 'Apagar micrófono' : 'Activar micrófono'}
          title={micEnabled ? 'Apagar micrófono' : 'Activar micrófono'}
        >
          {micEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
        </button>
        <button
          type="button"
          className={!cameraEnabled ? 'control muted' : 'control'}
          onClick={toggleCamera}
          aria-label={cameraEnabled ? 'Apagar cámara' : 'Activar cámara'}
          title={cameraEnabled ? 'Apagar cámara' : 'Activar cámara'}
        >
          {cameraEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
        </button>
        <button
          type="button"
          className="control end"
          onClick={onExit}
          aria-label="Finalizar llamada"
          title="Finalizar llamada"
        >
          <PhoneOutlined />
        </button>
      </footer>
    </main>
  )
}

import { useEffect, useRef, useState } from 'react'

export function LiveCall({ onExit }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [status, setStatus] = useState('Conectando cámara y micrófono…')
  const [error, setError] = useState(null)

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
        <button type="button" className="call-leave" onClick={onExit}>Salir</button>
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
            <span className="tile-name">Tú</span>
            <span className="camera-state">{cameraEnabled ? 'Cámara activa' : 'Cámara apagada'}</span>
          </article>
        </div>

        <aside className="call-analysis">
          <p className="analysis-kicker">ANÁLISIS EN TIEMPO REAL</p>
          <h1>Tu presencia en cámara</h1>
          <p className="analysis-muted">Las expresiones y landmarks aparecerán aquí durante la entrevista.</p>
          <div className="analysis-placeholder">
            <span className="analysis-pulse" />
            Esperando detección facial…
          </div>
        </aside>
      </section>

      {error && <p className="call-error" role="alert">{error}</p>}

      <footer className="call-controls">
        <button type="button" className={!micEnabled ? 'control muted' : 'control'} onClick={toggleMic}>
          {micEnabled ? 'Micrófono' : 'Micrófono apagado'}
        </button>
        <button type="button" className={!cameraEnabled ? 'control muted' : 'control'} onClick={toggleCamera}>
          {cameraEnabled ? 'Cámara' : 'Cámara apagada'}
        </button>
        <button type="button" className="control end" onClick={onExit}>Finalizar llamada</button>
      </footer>
    </main>
  )
}

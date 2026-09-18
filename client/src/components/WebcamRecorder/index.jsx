import { useEffect, useRef, useState } from 'react'

const MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

export function WebcamRecorder({ onRecorded }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const intervalRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  function stopStream() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  async function startCamera() {
    setError(null)
    setMessage(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      setCameraOn(false)
      setError(`No se pudo acceder a la cámara: ${err.message}`)
    }
  }

  function stopCamera() {
    if (recording) return
    stopStream()
    setCameraOn(false)
    setElapsed(0)
  }

  function startRecording() {
    const mimeType = pickMimeType()
    if (!mimeType || !streamRef.current) {
      setError('La grabación no está soportada en este navegador')
      return
    }
    setError(null)
    setMessage(null)
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const type = chunksRef.current.length ? chunksRef.current[0].type : mimeType
      const blob = new Blob(chunksRef.current, { type })
      const file = new File([blob], 'entrevista-zoom.webm', { type })
      setElapsed(0)
      setMessage('Grabación lista para analizar')
      onRecorded(file)
    }
    recorder.start(1000)
    setRecording(true)
    setElapsed(0)
    intervalRef.current = setInterval(() => setElapsed((value) => value + 1), 1000)
  }

  function stopRecording() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (recorderRef.current) {
      recorderRef.current.stop()
      recorderRef.current = null
    }
    setRecording(false)
  }

  return (
    <div className="zoom-shell">
      <div className="zoom-stage">
        <div className={`zoom-video ${recording ? 'is-recording' : ''}`}>
          {cameraOn ? (
            <video ref={videoRef} muted playsInline />
          ) : (
            <div className="zoom-empty">La cámara está apagada</div>
          )}
          <div className="zoom-chip">Tú</div>
          {recording && (
            <div className="zoom-rec">
              <span className="rec-dot" />
              REC {formatTime(elapsed)}
            </div>
          )}
        </div>
      </div>

      <div className="zoom-controls">
        {!cameraOn ? (
          <button type="button" className="zoom-btn primary" onClick={startCamera}>
            Activar cámara
          </button>
        ) : recording ? (
          <>
            <button type="button" className="zoom-btn" onClick={stopRecording}>
              Detener
            </button>
            <button
              type="button"
              className="zoom-btn"
              onClick={() => {
                stopRecording()
                stopCamera()
              }}
            >
              Detener y apagar
            </button>
          </>
        ) : (
          <>
            <button type="button" className="zoom-btn primary" onClick={startRecording}>
              Grabar
            </button>
            <button type="button" className="zoom-btn" onClick={stopCamera}>
              Apagar cámara
            </button>
          </>
        )}
      </div>

      {error && <p className="zoom-note error">{error}</p>}
      {message && <p className="zoom-note">{message}</p>}
    </div>
  )
}
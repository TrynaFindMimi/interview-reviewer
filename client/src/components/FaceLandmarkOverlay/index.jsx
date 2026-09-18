import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const DETECTION_INTERVAL = 1000 / 12

function blendshapeValue(categories, names) {
  return Math.max(
    ...names.map((name) => categories.find((category) => category.categoryName === name)?.score ?? 0),
  )
}

export function FaceLandmarkOverlay({ videoRef, onDetection }) {
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const timerRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const lastNotificationRef = useRef('')
  const onDetectionRef = useRef(onDetection)
  const [status, setStatus] = useState('Cargando detector facial…')

  useEffect(() => {
    onDetectionRef.current = onDetection
  }, [onDetection])

  useEffect(() => {
    let cancelled = false

    async function startDetector() {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        const options = {
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        }
        // Older integrated GPUs can crash inside the WebGL delegate. CPU is
        // more stable here and detection is already throttled below.
        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          ...options,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        })
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        setStatus('Detector facial activo')
      } catch (error) {
        setStatus(`No se pudo cargar MediaPipe: ${error.message}`)
      }
    }

    startDetector()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    let stopped = false
    let lastDetectionAt = 0

    function detectFrame() {
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current
      const now = performance.now()

      if (
        video &&
        canvas &&
        landmarker &&
        video.readyState >= 2 &&
        video.videoWidth &&
        now - lastDetectionAt >= DETECTION_INTERVAL &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastDetectionAt = now
        lastVideoTimeRef.current = video.currentTime
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }

        let result
        try {
          result = landmarker.detectForVideo(video, now)
        } catch (error) {
          setStatus(`Error de detección: ${error.message}`)
          if (!stopped) timerRef.current = setTimeout(detectFrame, DETECTION_INTERVAL)
          return
        }
        const landmarks = result.faceLandmarks?.[0] ?? []
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#2d8cff'
        context.strokeStyle = 'rgba(45, 140, 255, 0.72)'
        context.lineWidth = 1

        const connections = FaceLandmarker.FACE_LANDMARKS_TESSELATION ?? []
        for (const connection of connections) {
          const start = landmarks[connection.start]
          const end = landmarks[connection.end]
          if (!start || !end) continue
          context.beginPath()
          context.moveTo(start.x * canvas.width, start.y * canvas.height)
          context.lineTo(end.x * canvas.width, end.y * canvas.height)
          context.stroke()
        }

        for (const point of landmarks) {
          context.beginPath()
          context.arc(point.x * canvas.width, point.y * canvas.height, 1.25, 0, Math.PI * 2)
          context.fill()
        }

        const categories = result.faceBlendshapes?.[0]?.categories ?? []
        const expressions = {
          smile: blendshapeValue(categories, ['mouthSmileLeft', 'mouthSmileRight']),
          brow: blendshapeValue(categories, ['browInnerUp', 'browOuterUpLeft', 'browOuterUpRight']),
          blink: blendshapeValue(categories, ['eyeBlinkLeft', 'eyeBlinkRight']),
          jaw: blendshapeValue(categories, ['jawOpen']),
        }
        const notificationKey = `${landmarks.length}:${Object.values(expressions)
          .map((value) => Math.round(value * 20))
          .join(',')}`
        if (notificationKey !== lastNotificationRef.current) {
          lastNotificationRef.current = notificationKey
          onDetectionRef.current({
          detected: landmarks.length > 0,
          count: landmarks.length,
            expressions,
          })
        }
      }

      if (!stopped) timerRef.current = setTimeout(detectFrame, DETECTION_INTERVAL)
    }

    timerRef.current = setTimeout(detectFrame, DETECTION_INTERVAL)
    return () => {
      stopped = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [videoRef])

  return (
    <>
      <canvas ref={canvasRef} className="landmark-canvas" aria-label="Landmarks faciales" />
      <span className="landmark-status">{status}</span>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

function blendshapeValue(categories, names) {
  return Math.max(
    ...names.map((name) => categories.find((category) => category.categoryName === name)?.score ?? 0),
  )
}

export function FaceLandmarkOverlay({ videoRef, onDetection }) {
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const animationRef = useRef(null)
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
        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    function drawFrame() {
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current

      if (video && canvas && landmarker && video.readyState >= 2 && video.videoWidth) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }

        const result = landmarker.detectForVideo(video, performance.now())
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
        onDetectionRef.current({
          detected: landmarks.length > 0,
          count: landmarks.length,
          expressions: {
            smile: blendshapeValue(categories, ['mouthSmileLeft', 'mouthSmileRight']),
            brow: blendshapeValue(categories, ['browInnerUp', 'browOuterUpLeft', 'browOuterUpRight']),
            blink: blendshapeValue(categories, ['eyeBlinkLeft', 'eyeBlinkRight']),
            jaw: blendshapeValue(categories, ['jawOpen']),
          },
        })
      }

      animationRef.current = requestAnimationFrame(drawFrame)
    }

    animationRef.current = requestAnimationFrame(drawFrame)
    return () => cancelAnimationFrame(animationRef.current)
  }, [videoRef])

  return (
    <>
      <canvas ref={canvasRef} className="landmark-canvas" aria-label="Landmarks faciales" />
      <span className="landmark-status">{status}</span>
    </>
  )
}

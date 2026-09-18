import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const DETECTION_INTERVAL = 1000 / 30
const GAZE_COOLDOWN = 1000

function blendshapeValue(categories, names) {
  return Math.max(
    ...names.map((name) => categories.find((category) => category.categoryName === name)?.score ?? 0),
  )
}

export function FaceLandmarkOverlay({ videoRef, onDetection }) {
  const landmarkerRef = useRef(null)
  const timerRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const lastNotificationRef = useRef('')
  const gazeStateRef = useRef({ focused: true, candidate: true, candidateSince: 0 })
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
      const landmarker = landmarkerRef.current
      const now = performance.now()

      if (
        video &&
        landmarker &&
        video.readyState >= 2 &&
        video.videoWidth &&
        now - lastDetectionAt >= DETECTION_INTERVAL &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastDetectionAt = now
        lastVideoTimeRef.current = video.currentTime
        let result
        try {
          result = landmarker.detectForVideo(video, now)
        } catch (error) {
          setStatus(`Error de detección: ${error.message}`)
          if (!stopped) timerRef.current = setTimeout(detectFrame, DETECTION_INTERVAL)
          return
        }
        const landmarks = result.faceLandmarks?.[0] ?? []
        const categories = result.faceBlendshapes?.[0]?.categories ?? []
        const expressions = {
          smile: blendshapeValue(categories, ['mouthSmileLeft', 'mouthSmileRight']),
            brow: blendshapeValue(categories, ['browInnerUp', 'browOuterUpLeft', 'browOuterUpRight']),
            blink: blendshapeValue(categories, ['eyeBlinkLeft', 'eyeBlinkRight']),
            jaw: blendshapeValue(categories, ['jawOpen']),
          }
        const gaze = stabilizeGaze(estimateGaze(landmarks, categories), now, gazeStateRef.current)
        const notificationKey = `${landmarks.length}:${Object.values(expressions)
          .map((value) => Math.round(value * 20))
          .join(',')}:${Math.round(gaze.deviation * 20)}`
        if (notificationKey !== lastNotificationRef.current) {
          lastNotificationRef.current = notificationKey
          onDetectionRef.current({
          detected: landmarks.length > 0,
            count: landmarks.length,
            expressions,
            gaze,
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
    <span className="landmark-status">{status}</span>
  )
}

function estimateGaze(landmarks, categories) {
  if (landmarks.length < 478) return { deviation: 1, focused: false, reason: 'face_lost' }

  const leftIris = averagePoint(landmarks, [468, 469, 470, 471, 472])
  const rightIris = averagePoint(landmarks, [473, 474, 475, 476, 477])
  const leftRatio = horizontalRatio(leftIris, landmarks[33], landmarks[133])
  const rightRatio = horizontalRatio(rightIris, landmarks[362], landmarks[263])
  const deviation = Math.min(1, (Math.abs(leftRatio - 0.5) + Math.abs(rightRatio - 0.5)) / 0.5)
  const leftBlink = categoryScore(categories, 'eyeBlinkLeft')
  const rightBlink = categoryScore(categories, 'eyeBlinkRight')
  const oneEyeHidden =
    !irisVisible(landmarks, [468, 469, 470, 471, 472]) !==
      !irisVisible(landmarks, [473, 474, 475, 476, 477]) ||
    (leftBlink > 0.65 && rightBlink < 0.35) ||
    (rightBlink > 0.65 && leftBlink < 0.35)

  return {
    deviation,
    focused: deviation < 0.42 && !oneEyeHidden,
    reason: oneEyeHidden ? 'one_eye_hidden' : deviation < 0.42 ? 'focused' : 'gaze_away',
  }
}

function stabilizeGaze(gaze, now, state) {
  if (gaze.focused !== state.candidate) {
    state.candidate = gaze.focused
    state.candidateSince = now
    state.candidateReason = gaze.reason
  } else {
    state.candidateReason = gaze.reason
  }

  if (state.focused !== state.candidate && now - state.candidateSince >= GAZE_COOLDOWN) {
    state.focused = state.candidate
    state.reason = state.candidateReason
  }

  return { ...gaze, focused: state.focused, reason: state.reason ?? gaze.reason }
}

function categoryScore(categories, name) {
  return categories.find((category) => category.categoryName === name)?.score ?? 0
}

function irisVisible(landmarks, indices) {
  return indices.every((index) => {
    const point = landmarks[index]
    return point && point.x > 0.01 && point.x < 0.99 && point.y > 0.01 && point.y < 0.99
  })
}

function averagePoint(landmarks, indices) {
  return indices.reduce(
    (point, index) => ({ x: point.x + landmarks[index].x / indices.length, y: point.y + landmarks[index].y / indices.length }),
    { x: 0, y: 0 },
  )
}

function horizontalRatio(iris, firstCorner, secondCorner) {
  const min = Math.min(firstCorner.x, secondCorner.x)
  const width = Math.abs(firstCorner.x - secondCorner.x)
  return width ? (iris.x - min) / width : 0.5
}

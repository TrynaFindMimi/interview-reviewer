import os
from pathlib import Path

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from interview_reviewer.application.ports.analyzer import FaceGestureAnalyzer
from interview_reviewer.domain.value_objects.gesture_features import GestureStats

_MODEL_PATH = Path(
    os.environ.get(
        "IR_MODEL_PATH",
        Path(__file__).resolve().parents[4] / "models" / "face_landmarker.task",
    )
)
_GESTURE_THRESHOLD = 0.4


class _OnsetCounter:
    def __init__(self) -> None:
        self._active = {"smile": False, "brow": False, "blink": False, "jaw": False}
        self.smiles = 0
        self.eyebrow_raises = 0
        self.blinks = 0
        self.jaw_opens = 0

    def update(self, name: str, active: bool) -> None:
        if active and not self._active[name]:
            setattr(self, _COUNTER_BY_NAME[name], getattr(self, _COUNTER_BY_NAME[name]) + 1)
        self._active[name] = active


_COUNTER_BY_NAME = {
    "smile": "smiles",
    "brow": "eyebrow_raises",
    "blink": "blinks",
    "jaw": "jaw_opens",
}


class MediaPipeFaceGestureAnalyzer(FaceGestureAnalyzer):
    def __init__(self, model_path: Path = _MODEL_PATH) -> None:
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Modelo no encontrado: {model_path}")
        self._model_path = Path(model_path)

    def analyze(self, video_path: str) -> GestureStats:
        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video no encontrado: {path}")

        options = vision.FaceLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=str(self._model_path)),
            output_face_blendshapes=True,
            num_faces=1,
        )
        counter = _OnsetCounter()
        frames_with_face = 0
        total_frames = 0

        landmarker = vision.FaceLandmarker.create_from_options(options)
        try:
            capture = cv2.VideoCapture(str(path))
            try:
                while True:
                    ok, frame = capture.read()
                    if not ok:
                        break
                    total_frames += 1
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                    detection = landmarker.detect(image)
                    if not detection.face_landmarks:
                        continue
                    frames_with_face += 1
                    blendshapes = detection.face_blendshapes[0]
                    self._update_gestures(counter, blendshapes)
            finally:
                capture.release()
        finally:
            landmarker.close()

        return GestureStats(
            smiles=counter.smiles,
            eyebrow_raises=counter.eyebrow_raises,
            blinks=counter.blinks,
            jaw_opens=counter.jaw_opens,
            frames_with_face=frames_with_face,
            total_frames=total_frames,
        )

    @staticmethod
    def _blendshape(blendshapes, name: str) -> float:
        for category in blendshapes:
            if category.category_name == name:
                return category.score
        return 0.0

    def _update_gestures(self, counter: _OnsetCounter, blendshapes) -> None:
        smile = max(
            self._blendshape(blendshapes, "smileLeft"),
            self._blendshape(blendshapes, "smileRight"),
        )
        brow = self._blendshape(blendshapes, "browInnerUp")
        blink = max(
            self._blendshape(blendshapes, "eyeBlinkLeft"),
            self._blendshape(blendshapes, "eyeBlinkRight"),
        )
        jaw = self._blendshape(blendshapes, "jawOpen")
        counter.update("smile", smile >= _GESTURE_THRESHOLD)
        counter.update("brow", brow >= _GESTURE_THRESHOLD)
        counter.update("blink", blink >= _GESTURE_THRESHOLD)
        counter.update("jaw", jaw >= _GESTURE_THRESHOLD)
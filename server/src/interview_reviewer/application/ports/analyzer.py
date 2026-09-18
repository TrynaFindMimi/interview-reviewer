from typing import Protocol

from interview_reviewer.domain.value_objects.gesture_features import GestureStats


class FaceGestureAnalyzer(Protocol):
    def analyze(self, video_path: str) -> GestureStats: ...
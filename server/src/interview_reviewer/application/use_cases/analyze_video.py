from interview_reviewer.application.ports.analyzer import FaceGestureAnalyzer
from interview_reviewer.domain.value_objects.gesture_features import GestureStats


class AnalyzeVideoUseCase:
    def __init__(self, analyzer: FaceGestureAnalyzer) -> None:
        self._analyzer = analyzer

    def execute(self, video_path: str) -> GestureStats:
        if not video_path:
            raise ValueError("video_path no puede estar vacío")
        return self._analyzer.analyze(video_path)
import shutil
import tempfile
from pathlib import Path

import mediapipe
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from interview_reviewer.application.use_cases.analyze_video import AnalyzeVideoUseCase
from interview_reviewer.domain.value_objects.gesture_features import GestureStats
from interview_reviewer.infrastructure.mediapipe.face_gesture_analyzer import (
    MediaPipeFaceGestureAnalyzer,
)

_MODEL_NAME = "face_landmarker"


def build_app() -> FastAPI:
    use_case = AnalyzeVideoUseCase(MediaPipeFaceGestureAnalyzer())

    app = FastAPI(title="Interview Reviewer API", version="0.1.0")
    app.state.use_case = use_case

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok", "model": _MODEL_NAME, "mediapipe": mediapipe.__version__}

    @app.post("/api/analyze", response_model=GestureStats)
    def analyze(video: UploadFile) -> GestureStats:
        suffix = Path(video.filename or "upload.mp4").suffix
        if suffix.lower() not in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
            raise HTTPException(status_code=415, detail="Formato de video no soportado")
        with tempfile.TemporaryDirectory() as tmpdir:
            target = Path(tmpdir) / f"upload{suffix}"
            with target.open("wb") as buffer:
                shutil.copyfileobj(video.file, buffer)
            try:
                return use_case.execute(str(target))
            except FileNotFoundError as exc:
                raise HTTPException(status_code=404, detail=str(exc)) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=500, detail=f"Error analizando el video: {exc}"
                ) from exc

    return app


app = build_app()


def main() -> None:
    import uvicorn

    uvicorn.run(
        "interview_reviewer.entrypoints.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
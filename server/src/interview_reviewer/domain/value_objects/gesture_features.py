from dataclasses import dataclass


@dataclass(slots=True, frozen=True)
class GestureStats:
    smiles: int = 0
    eyebrow_raises: int = 0
    blinks: int = 0
    jaw_opens: int = 0
    frames_with_face: int = 0
    total_frames: int = 0

    @property
    def face_presence(self) -> float:
        if self.total_frames == 0:
            return 0.0
        return round(self.frames_with_face / self.total_frames, 4)
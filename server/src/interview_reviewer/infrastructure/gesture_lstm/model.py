"""Modelo LSTM para clasificación temporal de gestos faciales en tiempo real.

Las features de entrada son un subconjunto de blendshapes de MediaPipe
(Face Landmarker) normalizadas a [0, 1]. El LSTM procesa una ventana de
``WINDOW`` frames y predice, por frame, la probabilidad de cada gesto.
"""

from dataclasses import dataclass

import torch
from torch import nn

WINDOW = 32
HIDDEN = 64
LAYERS = 1

GESTURE_NAMES = ("smile", "brow_raise", "blink", "jaw_open")

# Índices de blendshapes que alimentan al LSTM.
SMILE_LEFT = 0
SMILE_RIGHT = 1
BROW_INNER_UP = 2
BROW_OUTER_UP_LEFT = 3
BROW_OUTER_UP_RIGHT = 4
EYE_BLINK_LEFT = 5
EYE_BLINK_RIGHT = 6
JAW_OPEN = 7

FEATURE_DIM = 8


class GestureLSTM(nn.Module):
    def __init__(self, input_dim: int = FEATURE_DIM, hidden: int = HIDDEN, n_gestures: int = len(GESTURE_NAMES)) -> None:
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden, num_layers=LAYERS, batch_first=True)
        self.head = nn.Linear(hidden, n_gestures)

    def forward(self, sequence: torch.Tensor) -> torch.Tensor:
        """``sequence`` con forma (B, T, input_dim) -> logits (B, T, n_gestures)."""
        hidden, _ = self.lstm(sequence)
        return self.head(hidden)


@dataclass(frozen=True)
class LSTMConfig:
    window: int = WINDOW
    hidden: int = HIDDEN

    @property
    def state_dict_path(self) -> str:
        import os

        root = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        )
        return os.path.join(root, "models", "gesture_lstm.pt")
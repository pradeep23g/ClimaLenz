"""Training pairs for the Continuity Engine.

Each sample: a REAL cloudy Sentinel-2 scene + its matching Sentinel-1 SAR
scene (input), paired with a REAL clean Sentinel-2 scene of the same AOI
from within a few days (target/ground truth). Self-supervised in spirit —
clouds move, so a clean shot of the same AOI usually exists nearby in
time; that clean shot stands in for "what the cloudy scene would have
shown."
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import numpy as np
import torch
from torch.utils.data import Dataset


@dataclass(slots=True, frozen=True)
class TrainingSample:
    optical_cloudy: np.ndarray   # (6, H, W), NaN over clouds
    sar: np.ndarray              # (2, H, W)
    cloud_mask: np.ndarray       # (H, W) bool
    optical_clean_target: np.ndarray  # (6, H, W), no NaNs — the label


class CloudRepairDataset(Dataset):
    """Wraps a pre-fetched list of TrainingSample.

    Fetching/pairing real scenes (finding a cloudy scene + a clean scene
    of the same AOI within N days + the matching SAR scene) is I/O-heavy
    and belongs in a separate data-prep script, not in __getitem__ — same
    separation heat_engine's training/dataset.py already uses.
    """

    def __init__(self, samples: list[TrainingSample]) -> None:
        self.samples = samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        s = self.samples[idx]
        optical_filled = np.nan_to_num(s.optical_cloudy, nan=0.0)
        return (
            torch.tensor(optical_filled, dtype=torch.float32),
            torch.tensor(s.sar, dtype=torch.float32),
            torch.tensor(s.cloud_mask.astype(np.float32), dtype=torch.float32).unsqueeze(0),
            torch.tensor(s.optical_clean_target, dtype=torch.float32),
        )

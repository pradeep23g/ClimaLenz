from __future__ import annotations

import torch
import torch.nn as nn


class ThermalCNN(nn.Module):
    """
    Lightweight 3-layer convolutional network used as both the physics-blind
    baseline and (after warm-starting) the physics-informed PINN.

    Architecture must exactly match the one used to produce the checkpoints
    in artifacts/baseline_cnn.pt and artifacts/pinn_model.pt (see
    training/train_baseline.py and training/train_pinn.py) -- changing the
    channel counts or kernel sizes here will break torch.load's
    load_state_dict() with a shape-mismatch error against those weights.

    Input:  (B, in_ch, H, W) -- default 3 channels: [LST_today, NDVI, LandCover]
    Output: (B, 1, H, W)     -- predicted LST for the next day
    """

    def __init__(self, in_ch: int = 3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, 32, 3, padding=1), nn.ReLU(),
            nn.Conv2d(32, 32, 3, padding=1), nn.ReLU(),
            nn.Conv2d(32, 1, 3, padding=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

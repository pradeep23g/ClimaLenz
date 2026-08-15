"""SAR-guided cloud reconstruction — a small U-Net.

Input: (8, H, W) = 6 optical bands (NaN over clouds, zero-filled for the
network) + 2 SAR bands (always valid) + a 1-channel cloud mask makes 9 —
see forward() for the exact concatenation.
Output: (6, H, W) reconstructed optical bands.

This applies a known, published pattern (SAR-optical fusion for gap
filling) rather than inventing new architecture — same posture as the
heat engine's PINN: known technique, applied correctly to this project's
actual data.
"""

from __future__ import annotations

import torch
import torch.nn as nn


class ConvBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class CloudRepairUNet(nn.Module):
    """Small U-Net: 9 input channels (6 optical + 2 SAR + 1 cloud mask),
    6 output channels (reconstructed optical bands)."""

    IN_CHANNELS = 9
    OUT_CHANNELS = 6

    def __init__(self) -> None:
        super().__init__()
        self.enc1 = ConvBlock(self.IN_CHANNELS, 32)
        self.pool1 = nn.MaxPool2d(2)
        self.enc2 = ConvBlock(32, 64)
        self.pool2 = nn.MaxPool2d(2)

        self.bottleneck = ConvBlock(64, 128)

        self.up2 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec2 = ConvBlock(128, 64)
        self.up1 = nn.ConvTranspose2d(64, 32, kernel_size=2, stride=2)
        self.dec1 = ConvBlock(64, 32)

        self.out_conv = nn.Conv2d(32, self.OUT_CHANNELS, kernel_size=1)

    def forward(
        self,
        optical_bands: torch.Tensor,  # (B, 6, H, W) — NaNs already zero-filled by caller
        sar_bands: torch.Tensor,      # (B, 2, H, W)
        cloud_mask: torch.Tensor,     # (B, 1, H, W) — 1.0 where cloud, 0.0 where real
    ) -> torch.Tensor:
        target_h, target_w = optical_bands.shape[-2], optical_bands.shape[-1]
        if sar_bands.shape[-2:] != (target_h, target_w):
            sar_bands = nn.functional.interpolate(sar_bands, size=(target_h, target_w), mode="bilinear", align_corners=False)
        if cloud_mask.shape[-2:] != (target_h, target_w):
            cloud_mask = nn.functional.interpolate(cloud_mask, size=(target_h, target_w), mode="nearest")

        x = torch.cat([optical_bands, sar_bands, cloud_mask], dim=1)

        e1 = self.enc1(x)
        p1 = self.pool1(e1)
        e2 = self.enc2(p1)
        p2 = self.pool2(e2)

        b = self.bottleneck(p2)

        u2 = self.up2(b)
        if u2.shape[-2:] != e2.shape[-2:]:
            u2 = nn.functional.interpolate(u2, size=e2.shape[-2:], mode="bilinear", align_corners=False)
        d2 = self.dec2(torch.cat([u2, e2], dim=1))

        u1 = self.up1(d2)
        if u1.shape[-2:] != e1.shape[-2:]:
            u1 = nn.functional.interpolate(u1, size=e1.shape[-2:], mode="bilinear", align_corners=False)
        d1 = self.dec1(torch.cat([u1, e1], dim=1))

        reconstructed = self.out_conv(d1)

        # Only replace the clouded pixels — never overwrite real, observed
        # data with the model's guess. This is a hard architectural
        # guarantee, not a training-time hope.
        return torch.where(cloud_mask.bool(), reconstructed, optical_bands)

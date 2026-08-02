"""Trains CloudRepairUNet and saves artifacts/cloud_repair_unet.pt.

Run from the continuity_engine/ root:
    python -m training.train_reconstruction

Requires a pre-built list of TrainingSample (see dataset.py) — populate
`build_training_samples()` with real fetched triplets before running.
This intentionally does NOT auto-fetch from Planetary Computer here;
keep data-gathering (slow, I/O-bound, worth caching to disk) separate
from the training loop, same reasoning as heat_engine's structure.
"""

from __future__ import annotations

from pathlib import Path

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader

from app.services.reconstruction_model import CloudRepairUNet
from training.dataset import CloudRepairDataset, TrainingSample

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"


def build_training_samples() -> list[TrainingSample]:
    """Placeholder — replace with real fetched (cloudy, sar, clean) triplets.

    For each AOI you already use (Chennai, your test water bodies):
      1. Find a real cloudy Sentinel-2 scene (use PlanetaryDualProvider's
         cloud-range search as a starting point).
      2. Find a clean Sentinel-2 scene of the SAME AOI within ~1-2 weeks.
      3. Find the matching Sentinel-1 SAR scene for the cloudy date.
      4. Append a TrainingSample(optical_cloudy=..., sar=...,
         cloud_mask=..., optical_clean_target=...).
    Cache these to disk (e.g. .npz files) after first fetch — re-hitting
    Planetary Computer on every training run wastes time and risks rate
    limits.
    """
    raise NotImplementedError(
        "Populate this with real fetched training triplets before running "
        "this script. See the docstring for the exact steps."
    )


def train() -> None:
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    samples = build_training_samples()
    dataset = CloudRepairDataset(samples)
    loader = DataLoader(dataset, batch_size=4, shuffle=True)

    model = CloudRepairUNet().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)

    epochs = 30
    for epoch in range(epochs):
        total_loss = 0.0
        for optical, sar, mask, target in loader:
            optical, sar, mask, target = (
                optical.to(device),
                sar.to(device),
                mask.to(device),
                target.to(device),
            )
            opt.zero_grad()
            pred = model(optical, sar, mask)

            # Loss ONLY over the cloud-masked region — the model gets no
            # credit/penalty for regions it wasn't asked to reconstruct,
            # same reasoning as heat_engine masking its loss to land pixels.
            loss = F.mse_loss(pred * mask, target * mask)
            loss.backward()
            opt.step()
            total_loss += loss.item()

        print(f"Epoch {epoch + 1}/{epochs} - Loss: {total_loss / len(loader):.4f}")

    torch.save(model.state_dict(), ARTIFACTS_DIR / "cloud_repair_unet.pt")
    print(f"Saved to {ARTIFACTS_DIR / 'cloud_repair_unet.pt'}")


if __name__ == "__main__":
    train()

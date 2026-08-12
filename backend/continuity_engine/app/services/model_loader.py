"""Loads trained CloudRepairUNet weights from artifacts/.

Same pattern as heat_engine's model_loader.py. Kept as its own module so
callers that don't need inference (e.g. just computing confidence maps)
never trigger a torch import.
"""

from __future__ import annotations

from pathlib import Path

ARTIFACTS_DIR = Path(__file__).parent.parent.parent / "artifacts"


import functools

@functools.lru_cache(maxsize=1)
def load_repair_model(filename: str = "cloud_repair_unet.pt"):
    import torch

    from app.services.reconstruction_model import CloudRepairUNet

    model = CloudRepairUNet()
    weights_path = ARTIFACTS_DIR / filename
    if not weights_path.exists():
        raise FileNotFoundError(
            f"No trained weights found at {weights_path}. Run "
            f"training/train_reconstruction.py first, or copy a trained "
            f".pt file into artifacts/."
        )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.load_state_dict(torch.load(weights_path, weights_only=True, map_location=device))
    model.eval()
    return model

"""End-to-end Layer 0 pipeline: fetch -> reconstruct -> score confidence.

Mirrors water_engine's pipeline.py and heat_engine's pipeline.py shape.
Torch is imported lazily, only inside run_reconstruction(), so this
module — and the FastAPI app built on top of it — can be imported and
its routes inspected even in an environment without torch installed.
"""

from __future__ import annotations

import numpy as np

from app.services.confidence_map import compute_confidence_map
from app.services.satellite.client_factory import get_dual_source_provider


def run_reconstruction(*, geometry: dict, start_date, end_date) -> dict:
    provider = get_dual_source_provider()
    bundle = provider.fetch(geometry=geometry, start_date=start_date, end_date=end_date)

    confidence = compute_confidence_map(bundle.cloud_mask, sar_available=True)

    reconstructed_shape = list(bundle.optical_bands.shape)

    if bundle.cloud_mask.any():
        import torch

        from app.services.model_loader import load_repair_model

        model = load_repair_model()

        optical_filled = np.nan_to_num(bundle.optical_bands, nan=0.0)
        optical_t = torch.from_numpy(optical_filled).unsqueeze(0).float()
        sar_t = torch.from_numpy(bundle.sar_bands).unsqueeze(0).float()
        mask_t = torch.from_numpy(bundle.cloud_mask.astype(np.float32)).unsqueeze(0).unsqueeze(0)

        with torch.no_grad():
            reconstructed_t = model(optical_t, sar_t, mask_t)
        reconstructed = reconstructed_t.squeeze(0).numpy()
    else:
        reconstructed = bundle.optical_bands

    return {
        "optical_scene_id": bundle.optical_scene_id,
        "sar_scene_id": bundle.sar_scene_id,
        "provider": bundle.provider,
        "capture_date": bundle.capture_date.isoformat(),
        "original_cloud_cover_pct": bundle.cloud_cover_pct,
        "scene_confidence": confidence.scene_confidence,
        "reconstructed_fraction": confidence.reconstructed_fraction,
        "low_confidence_fraction": confidence.low_confidence_fraction,
        "caveats": confidence.caveats,
        "reconstructed_bands_shape": reconstructed_shape,
        "_reconstructed_array": reconstructed,        # internal use, not in the response schema
        "_pixel_confidence_array": confidence.pixel_confidence,  # internal use
    }

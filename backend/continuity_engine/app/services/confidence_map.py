"""Per-pixel reconstruction confidence — the actual point of Layer 0.

Filling in cloud gaps is the visible half of this layer; this module is
the half that matters for the project's "Honest AI" identity. A
reconstructed pixel is never presented with the same certainty as a real
one. This stays a pure function of its inputs — no model, no randomness —
same design discipline as water_engine's risk_model.py and
data_confidence.py, applied here to reconstruction specifically.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np


@dataclass(slots=True, frozen=True)
class ReconstructionConfidenceMap:
    """Per-pixel and scene-level confidence for one repaired scene."""

    pixel_confidence: np.ndarray
    """Shape (H, W), float in [0, 1]. 1.0 = real, untouched pixel.
    Lower values = more of this pixel's value was model-inferred."""

    scene_confidence: float
    """Single aggregate score for the whole scene, area-weighted."""

    reconstructed_fraction: float
    """Fraction of the AOI that required any reconstruction at all."""

    low_confidence_fraction: float
    """Fraction of the AOI below LOW_CONFIDENCE_THRESHOLD — the part a
    downstream consumer should treat with real skepticism."""

    caveats: list[str] = field(default_factory=list)


LOW_CONFIDENCE_THRESHOLD = 0.4
DISTANCE_DECAY = 0.15
"""How fast confidence falls off with distance from the nearest real
pixel — larger cloud gaps get lower confidence at their center, which is
the correct behavior: the model has less real signal to anchor a guess
the further it is from any actual observed pixel."""


def _distance_to_nearest_valid(cloud_mask: np.ndarray) -> np.ndarray:
    """Chebyshev distance (in pixels) from each masked pixel to the
    nearest unmasked pixel. Pure numpy, no scipy dependency needed for
    this simple a distance transform at 64x64 scale."""
    h, w = cloud_mask.shape
    valid = ~cloud_mask
    if valid.all():
        return np.zeros((h, w), dtype=np.float32)
    if not valid.any():
        return np.full((h, w), max(h, w), dtype=np.float32)

    valid_coords = np.argwhere(valid)
    all_coords = np.argwhere(np.ones((h, w), dtype=bool))

    # Chunked to avoid an (H*W, N_valid) blowup on larger grids later.
    dist = np.empty(h * w, dtype=np.float32)
    chunk = 256
    for start in range(0, all_coords.shape[0], chunk):
        block = all_coords[start : start + chunk]
        
        # Compute abs differences separately for y and x to avoid (chunk, N, 2) allocation
        dy = np.abs(block[:, None, 0] - valid_coords[None, :, 0])
        dx = np.abs(block[:, None, 1] - valid_coords[None, :, 1])
        diffs = np.maximum(dy, dx)
        
        dist[start : start + chunk] = diffs.min(axis=1)
    return dist.reshape(h, w)


def compute_confidence_map(
    cloud_mask: np.ndarray,
    sar_available: bool = True,
) -> ReconstructionConfidenceMap:
    """Build a confidence map from the cloud mask alone.

    Deliberately does NOT require the trained model or its output —
    confidence here is about how much real signal existed to reconstruct
    FROM, which is knowable before/independent of any specific model's
    prediction. A separate, model-output-aware refinement (e.g. ensemble
    variance) is a legitimate future upgrade, not required for this to
    be honest and useful today.
    """
    if cloud_mask.dtype != bool:
        cloud_mask = cloud_mask.astype(bool)

    distance = _distance_to_nearest_valid(cloud_mask)
    max_dim = max(cloud_mask.shape)

    # Real pixels: confidence 1.0, always.
    pixel_confidence = np.ones(cloud_mask.shape, dtype=np.float32)

    # Reconstructed pixels: confidence decays with distance from the
    # nearest real pixel. SAR availability sets the ceiling — SAR-guided
    # reconstruction is meaningfully more trustworthy than optical-only
    # inpainting from surrounding context alone.
    ceiling = 0.85 if sar_available else 0.55
    decayed = ceiling * np.exp(-DISTANCE_DECAY * distance)
    pixel_confidence = np.where(cloud_mask, decayed, pixel_confidence)
    pixel_confidence = np.clip(pixel_confidence, 0.0, 1.0).astype(np.float32)

    reconstructed_fraction = float(cloud_mask.mean())
    low_conf_fraction = float((pixel_confidence < LOW_CONFIDENCE_THRESHOLD).mean())
    scene_confidence = float(pixel_confidence.mean())

    caveats: list[str] = []
    if reconstructed_fraction > 0:
        caveats.append(
            f"{reconstructed_fraction:.0%} of this scene was cloud-affected and "
            f"reconstructed, not directly observed."
        )
    if low_conf_fraction > 0.05:
        caveats.append(
            f"{low_conf_fraction:.0%} of the scene falls below the "
            f"{LOW_CONFIDENCE_THRESHOLD} confidence threshold — treat any risk "
            f"score computed over this area as a low-confidence estimate, "
            f"not a reliable reading."
        )
    if not sar_available and reconstructed_fraction > 0:
        caveats.append(
            "No SAR scene was available to guide reconstruction; confidence is "
            "capped lower than the SAR-guided case."
        )

    return ReconstructionConfidenceMap(
        pixel_confidence=pixel_confidence,
        scene_confidence=scene_confidence,
        reconstructed_fraction=reconstructed_fraction,
        low_confidence_fraction=low_conf_fraction,
        caveats=caveats,
    )

from __future__ import annotations

# `BandStack` is the generic interface spectral_engine.py programs against
# (attributes: blue, green, red, red_edge, nir, swir, valid_mask, spatial_resolution_m).
# ReflectanceCube is the concrete implementation shared by every satellite
# provider (synthetic + Planetary Computer), so we simply expose it under the
# name the rest of the codebase expects.
from app.services.satellite.provider_contracts import ReflectanceCube as BandStack

__all__ = ["BandStack"]

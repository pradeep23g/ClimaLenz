from __future__ import annotations

import hashlib
import json
import logging
from datetime import date, datetime, time, timezone
from typing import Any, Dict

import numpy as np

# Importing the production contracts we built previously
from app.services.satellite.provider_contracts import (
    EarthObservationClient,
    ObservationContext,
    ReflectanceCube,
)

logger = logging.getLogger(__name__)


class SyntheticObservationClient:
    """
    Deterministic mock provider generating synthetic Sentinel-2 spectral signatures.
    Strictly implements EarthObservationClient for network-isolated demos and CI/CD.
    """
    
    gateway_name = "climalenz-synthetic-engine"

    def retrieve_scene(
        self,
        *,
        spatial_bounds: Dict[str, Any],
        search_start: date,
        search_end: date,
        max_cloud_tolerance: float,
    ) -> ObservationContext:
        """
        Generates stable synthetic satellite data bounded by the requested AOI.
        """
        # 1. Deterministic Seeding (Fixed the repr() bug from legacy code)
        # json.dumps with sort_keys guarantees identical byte output across all environments
        bound_str = json.dumps(spatial_bounds, sort_keys=True).encode("utf-8")
        seed_hash = hashlib.md5(bound_str).digest()
        
        # Extract a 32-bit integer for the numpy generator
        rng_seed = int.from_bytes(seed_hash[:4], byteorder="little")
        rng = np.random.default_rng(rng_seed)
        
        dim_y, dim_x = 64, 64

        # 2. Baseline Spectral Generation
        b_blue = rng.uniform(0.04, 0.10, (dim_y, dim_x)).astype(np.float32)
        b_green = rng.uniform(0.06, 0.14, (dim_y, dim_x)).astype(np.float32)
        b_red = rng.uniform(0.04, 0.12, (dim_y, dim_x)).astype(np.float32)
        b_re = rng.uniform(0.04, 0.15, (dim_y, dim_x)).astype(np.float32)
        b_nir = rng.uniform(0.02, 0.10, (dim_y, dim_x)).astype(np.float32)
        b_swir = rng.uniform(0.02, 0.08, (dim_y, dim_x)).astype(np.float32)

        # 3. Simulated Ecological Variance
        algal_driver = (rng_seed % 100) / 100.0
        
        # Memory-efficient in-place addition (prevents unnecessary array allocations)
        b_re += (0.15 * algal_driver)
        b_green += (0.05 * algal_driver)

        valid_pixels = np.ones((dim_y, dim_x), dtype=bool)

        simulated_cube = ReflectanceCube(
            blue=b_blue,
            green=b_green,
            red=b_red,
            red_edge=b_re,
            nir=b_nir,
            swir=b_swir,
            valid_mask=valid_pixels,
            resolution=10.0
        )

        # 4. Secure Temporal Assignment
        capture_timestamp = datetime.combine(search_end, time(10, 30, tzinfo=timezone.utc))
        simulated_cloud_pct = min(5.0 + (rng_seed % 10), max_cloud_tolerance)

        logger.info(f"Generated synthetic cube [Seed: {hex(rng_seed)}] with {simulated_cloud_pct}% simulated cloud cover.")

        return ObservationContext(
            data_cube=simulated_cube,
            asset_id=f"synth-{rng_seed:08x}",
            acquisition_timestamp=capture_timestamp,
            cloud_fraction=float(simulated_cloud_pct),
            source_platform="Synthetic-Simulator-V1",
            preview_uri=None,
            extended_metadata={
                "is_synthetic_mock": True,
                "injected_chlorophyll_variance": algal_driver,
                "seed_reference": hex(rng_seed),
            }
        )
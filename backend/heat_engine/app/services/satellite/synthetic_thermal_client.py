from __future__ import annotations

import hashlib
import json
import logging
from typing import List, Tuple

import numpy as np

logger = logging.getLogger(__name__)

DEFAULT_GRID = (64, 64)
DEFAULT_DAYS = 31


class SyntheticThermalClient:
    """
    Deterministic mock thermal-data provider. Generates a full, self-consistent
    (lst_stack, ndvi_grid, landcover_grid, land_mask) tuple without touching
    the network, so heat_engine can be exercised end-to-end for offline demos
    and CI -- the same role water_engine's SyntheticObservationClient already
    plays there.

    Every value produced here is synthetic and explicitly logged as such; it
    should never be treated as a real environmental reading.
    """

    gateway_name = "climalenz-synthetic-thermal-engine"

    def build_training_arrays(
        self,
        bbox: List[float] = [80.15, 12.98, 80.29, 13.11],
        date_range: str = "2025-01-01/2026-07-31",
        grid_shape: Tuple[int, int] = DEFAULT_GRID,
        num_days: int = DEFAULT_DAYS,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, str]:
        # Deterministic seeding via json.dumps(sort_keys=True) rather than
        # repr() -- repr() of a dict is key-order-dependent, which bit the
        # water_engine synthetic client earlier in this project (two
        # logically-identical bboxes could hash to different seeds).
        seed_payload = json.dumps({"bbox": bbox, "date_range": date_range}, sort_keys=True).encode("utf-8")
        seed_hash = hashlib.md5(seed_payload).digest()
        rng_seed = int.from_bytes(seed_hash[:4], byteorder="little")
        rng = np.random.default_rng(rng_seed)

        h, w = grid_shape

        # --- Synthetic LST stack (T, H, W): a smooth seasonal drift + daily noise ---
        base_temp = 30.0 + 3.0 * np.sin(np.linspace(0, 2 * np.pi, num_days))
        lst_stack = np.stack([
            np.clip(base_temp[t] + rng.normal(0, 1.2, (h, w)), 15.0, 48.0).astype("float32")
            for t in range(num_days)
        ])

        # --- Synthetic NDVI grid (H, W): spatially smooth, clipped to a realistic range ---
        x = np.linspace(-1, 1, w)
        y = np.linspace(-1, 1, h)
        xx, yy = np.meshgrid(x, y)
        ndvi_grid = np.clip(
            0.3 + 0.2 * np.sin(xx * 4) * np.cos(yy * 4) + rng.normal(0, 0.02, (h, w)),
            0.05, 0.7,
        ).astype("float32")

        # --- Synthetic landcover grid, using real ESA WorldCover class codes ---
        # so downstream physics (training/train_pinn.py's per-class thermal
        # diffusivity) is exercised against realistic categorical values
        # instead of arbitrary placeholder numbers.
        landcover_grid = np.full((h, w), 40, dtype="float32")               # 40 = cropland baseline
        landcover_grid[:, : int(w * 0.3)] = 50                              # 50 = built-up strip
        landcover_grid[:, int(w * 0.3): int(w * 0.55)] = 10                 # 10 = tree cover strip
        landcover_grid[:, int(w * 0.85):] = 80                              # 80 = water (east edge / coast)

        land_mask = np.ones((h, w), dtype="float32")
        land_mask[landcover_grid == 80] = 0.0

        logger.warning(
            f"Generated synthetic thermal dataset [Seed: {hex(rng_seed)}] "
            f"lst_stack.shape={lst_stack.shape} -- is_synthetic_mock=True."
        )

        return lst_stack, ndvi_grid, landcover_grid, land_mask, "synthetic_fallback"

    def build_inference_arrays(
        self,
        bbox: List[float] = DEFAULT_BBOX,
        date_range: str = "2025-01-01/2026-07-31",
        grid_shape: Tuple[int, int] = DEFAULT_GRID,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, str]:
        """
        Build inference arrays (x_test and y_real) along with grids.
        """
        lst_stack, ndvi_grid, landcover_grid, land_mask, data_provenance = self.build_training_arrays(
            bbox=bbox, date_range=date_range, grid_shape=grid_shape, num_days=2
        )
        return lst_stack[0], lst_stack[1], ndvi_grid, landcover_grid, land_mask, data_provenance

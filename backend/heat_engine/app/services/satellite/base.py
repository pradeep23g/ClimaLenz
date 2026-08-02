from __future__ import annotations

from typing import List, Protocol, Tuple, runtime_checkable

import numpy as np


@runtime_checkable
class ThermalDataClient(Protocol):
    """
    Structural interface every thermal satellite client (real or synthetic)
    must satisfy, so app/services/satellite/client_factory.py can swap
    between them transparently based on CLIMALENZ_LOCAL_MOCK_API -- the same
    pattern already proven in water_engine's provider_contracts.py.

    Being a Protocol, neither PlanetaryThermalClient nor SyntheticThermalClient
    needs to explicitly inherit from this -- they just need to implement
    build_training_arrays() with a matching signature.
    """

    def build_training_arrays(
        self,
        bbox: List[float] = ...,
        date_range: str = ...,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Returns (lst_stack, ndvi_grid, landcover_grid, land_mask) ready to
        hand straight to training.dataset.prepare_dataloaders() or
        app.pipeline.run_simulation_pipeline().

        lst_stack:      (T, H, W) float32, degrees Celsius
        ndvi_grid:      (H, W)    float32, [-1, 1]
        landcover_grid: (H, W)    float32, ESA WorldCover class codes
        land_mask:      (H, W)    float32, 1.0 = land, 0.0 = water
        """
        ...

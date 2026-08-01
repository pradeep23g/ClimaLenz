from __future__ import annotations

from enum import Enum
from typing import Tuple


class SpectralSignature(str, Enum):
    """
    Comprehensive spectral index definitions with embedded physical band associations.
    """
    NDWI = "NDWI"    # McFeeters' Open Water Index (Green/NIR)
    LSWI = "LSWI"    # Gao's Canopy/Algae Moisture Index 
    MNDWI = "MNDWI"  # Modified NDWI (optimized for urban areas)
    NDTI = "NDTI"    # Normalized Difference Turbidity Index
    NDCI = "NDCI"    # Normalized Difference Chlorophyll Index
    NDVI = "NDVI"    # Normalized Difference Vegetation Index
    WRI = "WRI"      # Water Ratio Index

    @property
    def required_bands(self) -> Tuple[str, ...]:
        """Returns the standard spectral wavelengths required to compute the index."""
        band_map = {
            self.NDWI: ("Green", "NIR"),
            self.LSWI: ("NIR", "SWIR"),
            self.MNDWI: ("Green", "SWIR"),
            self.NDTI: ("Red", "Green"),
            self.NDCI: ("RedEdge1", "Red"),
            self.NDVI: ("NIR", "Red"),
            self.WRI: ("Green", "Red", "NIR", "SWIR"),
        }
        return band_map.get(self, ())

    @property
    def tracking_target(self) -> str:
        """Classifies the index by its physical observation target."""
        if self in {self.NDWI, self.MNDWI, self.WRI}:
            return "WATER_EXTENT"
        elif self in {self.NDTI, self.NDCI}:
            return "WATER_QUALITY"
        elif self in {self.NDVI, self.LSWI}:
            return "VEGETATION_HEALTH"
        return "UNKNOWN"
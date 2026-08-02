from __future__ import annotations

from enum import Enum, IntEnum


class InterventionType(str, Enum):
    """
    Micro-climate intervention categories supported by the what-if engine.
    Values match the bare strings already used throughout
    app/services/physics_guardrail.py and app/services/what_if_engine.py --
    this enum formalizes those strings for request validation without
    requiring changes to the logic that already consumes them (a str Enum
    compares equal to its plain-string value, so `"CANOPY" in max_bounds`
    style checks in physics_guardrail.py keep working unmodified).
    """
    CANOPY = "CANOPY"
    COOL_ROOF = "COOL_ROOF"
    ALBEDO_CHANGE = "ALBEDO_CHANGE"


class ESAWorldCoverClass(IntEnum):
    """
    ESA WorldCover v200 class codes, as returned in the 'map' raster band
    fetched by PlanetaryThermalClient.fetch_esa_worldcover_item() and
    consumed by app/services/preprocessing.generate_landcover_and_mask()
    and training/train_pinn.py's per-class thermal diffusivity lookup.
    Reference: https://esa-worldcover.org/en/data-access
    """
    TREE_COVER = 10
    SHRUBLAND = 20
    GRASSLAND = 30
    CROPLAND = 40
    BUILT_UP = 50
    BARE_SPARSE_VEGETATION = 60
    SNOW_AND_ICE = 70
    PERMANENT_WATER_BODIES = 80
    HERBACEOUS_WETLAND = 90
    MANGROVES = 95
    MOSS_AND_LICHEN = 100


class GuardrailStatus(str, Enum):
    """Mirrors the literal status strings returned by physicist_agent()."""
    PASSED = "PASSED"
    FLAGGED = "FLAGGED"

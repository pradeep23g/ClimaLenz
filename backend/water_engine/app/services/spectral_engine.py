
from __future__ import annotations

import numpy as np
from pydantic import BaseModel, Field, ConfigDict


from app.models.spectral_defs import SpectralSignature
from app.services.satellite.base import BandStack


class SpectralMetrics(BaseModel):
    """
    Pydantic schema for aggregated spectral statistics over a validated water mask.
    """
    model_config = ConfigDict(frozen=True)

    signature: SpectralSignature
    mean_val: float
    min_val: float
    max_val: float
    std_dev: float
    pixel_count: int = Field(ge=0)
    interpretation: str
    bands_used: tuple[str, ...]


class SceneSpectralSummary(BaseModel):
    """
    Payload containing all computed spectral metrics and spatial water coverage.
    """
    model_config = ConfigDict(frozen=True)

    metrics: list[SpectralMetrics]
    water_coverage_ratio: float = Field(ge=0.0, le=1.0)
    flooded_vegetation_ratio: float = Field(
        ge=0.0, le=1.0,
        description=(
            "Fraction of the valid scene domain flagged as vegetated but "
            "saturated/inundated (Xiao et al. 2005 LSWI-vs-NDVI test). This "
            "is disjoint from water_coverage_ratio by construction: it only "
            "fires on pixels carrying a genuine vegetation signal, catching "
            "flooding that NDWI/MNDWI structurally miss because canopy "
            "blocks the open-water reflectance signature."
        ),
    )


# --- Core Mathematical Engine ---

def _compute_normalized_ratio(band_1: np.ndarray, band_2: np.ndarray) -> np.ndarray:
    """
    Optimized normalized difference calculation: (B1 - B2) / (B1 + B2).
    Uses np.divide with 'where' and 'out' kwargs for zero-copy memory safety,
    avoiding the overhead of np.where masks.
    """
    numerator = band_1 - band_2
    denominator = band_1 + band_2
    return np.divide(
        numerator, 
        denominator, 
        out=np.full_like(numerator, np.nan, dtype=np.float32), 
        where=(np.abs(denominator) > 1e-9)
    )


def _compute_direct_ratio(band_num: np.ndarray, band_den: np.ndarray) -> np.ndarray:
    """Computes direct division for non-normalized indices like WRI."""
    return np.divide(
        band_num, 
        band_den, 
        out=np.full_like(band_num, np.nan, dtype=np.float32), 
        where=(np.abs(band_den) > 1e-9)
    )


def execute_index(signature: SpectralSignature, stack: BandStack) -> np.ndarray:
    """Routes the spectral signature to its physical band computation."""
    if signature == SpectralSignature.NDWI:
        return _compute_normalized_ratio(stack.green, stack.nir)
    if signature == SpectralSignature.LSWI:
        return _compute_normalized_ratio(stack.nir, stack.swir)
    if signature == SpectralSignature.MNDWI:
        return _compute_normalized_ratio(stack.green, stack.swir)
    if signature == SpectralSignature.NDTI:
        return _compute_normalized_ratio(stack.red, stack.green)
    if signature == SpectralSignature.NDCI:
        return _compute_normalized_ratio(stack.red_edge, stack.red)
    if signature == SpectralSignature.NDVI:
        return _compute_normalized_ratio(stack.nir, stack.red)
    if signature == SpectralSignature.WRI:
        return _compute_direct_ratio((stack.green + stack.red), (stack.nir + stack.swir))
    
    raise ValueError(f"Unsupported spectral signature: {signature}")


# --- Spatial Masking ---

def generate_water_mask(
    stack: BandStack, 
    ndwi_thresh: float = 0.0, 
    mndwi_thresh: float = 0.0
) -> np.ndarray:
    """
    Generates a boolean matrix isolating likely water pixels using a dual-index approach.
    Suppresses vegetation false positives by intersecting NDWI and MNDWI constraints.
    Note: LSWI is deliberately excluded from this mask as it tracks moisture, not
    open-water boundaries — see generate_flooded_vegetation_mask() for that signal.
    """
    ndwi_matrix = execute_index(SpectralSignature.NDWI, stack)
    mndwi_matrix = execute_index(SpectralSignature.MNDWI, stack)
    
    valid_data_mask = stack.valid_mask & np.isfinite(ndwi_matrix) & np.isfinite(mndwi_matrix)
    water_presence_mask = (ndwi_matrix > ndwi_thresh) & (mndwi_matrix > mndwi_thresh)
    
    return valid_data_mask & water_presence_mask


def generate_flooded_vegetation_mask(
    stack: BandStack,
    tolerance: float = 0.05,
    min_ndvi: float = 0.10,
) -> np.ndarray:
    """
    Flood-under-canopy detector, after Xiao et al. (2005/2006), 'Mapping paddy
    rice agriculture in southern China using multi-temporal MODIS images'.

    NDWI/MNDWI locate *open* water by looking at green/NIR/SWIR reflectance
    from the surface — a canopy sitting on top of standing water hides that
    signal entirely, so flooded vegetation reads as ordinary dry land to
    those two indices. LSWI doesn't have that blind spot: SWIR is absorbed
    by liquid water whether or not there's a canopy over it.

    The Xiao test compares the two directly rather than picking an absolute
    LSWI cutoff: a pixel is flagged as flooded/saturated vegetation when its
    moisture signal (LSWI) is at or above what its greenness (NDVI) alone
    would predict, within a small tolerance margin (LSWI + tolerance >= NDVI).
    That comparison is what makes it a meaningful compound signal instead of
    an arbitrary threshold on either index alone.

    `min_ndvi` deliberately excludes bare open water and bare soil from this
    mask. Open water has near-zero/negative NDVI and trivially satisfies
    LSWI >= NDVI, but it's not "flooded vegetation" — it's just water, and
    it's already counted in generate_water_mask(). Without this guard the
    two masks would overlap and double-count the same pixels under two
    different labels.
    """
    lswi_matrix = execute_index(SpectralSignature.LSWI, stack)
    ndvi_matrix = execute_index(SpectralSignature.NDVI, stack)

    valid_data_mask = stack.valid_mask & np.isfinite(lswi_matrix) & np.isfinite(ndvi_matrix)
    carries_vegetation_signal = ndvi_matrix > min_ndvi
    moisture_meets_or_exceeds_canopy = (lswi_matrix + tolerance) >= ndvi_matrix

    return valid_data_mask & carries_vegetation_signal & moisture_meets_or_exceeds_canopy


# --- Telemetry Interpretation ---

# Replaces the massive match/case block with a scalable, flat threshold dictionary.
_INTERPRETATION_THRESHOLDS = {
    SpectralSignature.NDWI: [
        (0.3, "clear open water"),
        (0.0, "water present, possibly turbid or mixed"),
        (float("-inf"), "land-dominated; little open water"),
    ],
    SpectralSignature.LSWI: [
        (0.2, "high biological moisture; potential algal/plant saturation"),
        (0.0, "moderate vegetative moisture present"),
        (float("-inf"), "low moisture; minimal aquatic vegetation"),
    ],
    SpectralSignature.MNDWI: [
        (0.3, "strong water signal even in urban context"),
        (0.0, "water present; some confusion with built-up surfaces possible"),
        (float("-inf"), "non-water dominant"),
    ],
    SpectralSignature.NDTI: [
        (0.4, "high turbidity"),
        (0.2, "elevated turbidity"),
        (0.0, "moderate clarity"),
        (float("-inf"), "low turbidity"),
    ],
    SpectralSignature.NDCI: [
        (0.2, "high chlorophyll-a; possible bloom signal"),
        (0.05, "elevated chlorophyll-a"),
        (-0.05, "background chlorophyll"),
        (float("-inf"), "very low chlorophyll signal"),
    ],
    SpectralSignature.NDVI: [
        (0.5, "dense shoreline vegetation"),
        (0.2, "active vegetation present"),
        (0.0, "sparse vegetation or stressed canopy"),
        (float("-inf"), "no vegetation signal over the water mask"),
    ],
    SpectralSignature.WRI: [
        (2.5, "strong open-water moisture signature"),
        (1.0, "wet surface or shallow water"),
        (float("-inf"), "dry surface dominant"),
    ],
}

def _resolve_interpretation(signature: SpectralSignature, metric_val: float) -> str:
    """Resolves human-readable environmental state from mathematical thresholds."""
    if not np.isfinite(metric_val):
        return "invalid or insufficient data"
        
    for threshold, label in _INTERPRETATION_THRESHOLDS.get(signature, []):
        if metric_val > threshold:
            return label
    return "unknown signature state"


# --- Aggregation Pipeline ---

def compile_metrics(
    signature: SpectralSignature, 
    matrix: np.ndarray, 
    spatial_mask: np.ndarray
) -> SpectralMetrics:
    """Extracts statistical parameters from a spectral matrix bounded by a spatial mask."""
    if spatial_mask.shape != matrix.shape:
        raise ValueError("Spatial mask dimensions must strictly match the spectral matrix.")
        
    valid_pixels = spatial_mask & np.isfinite(matrix)
    data_sample = matrix[valid_pixels]
    
    # Fallback if mask is entirely empty
    if data_sample.size == 0:
        data_sample = matrix[np.isfinite(matrix)]
        
    has_data = data_sample.size > 0
    mean_v = float(np.mean(data_sample)) if has_data else float("nan")
    
    return SpectralMetrics(
        signature=signature,
        mean_val=mean_v,
        min_val=float(np.min(data_sample)) if has_data else float("nan"),
        max_val=float(np.max(data_sample)) if has_data else float("nan"),
        std_dev=float(np.std(data_sample)) if has_data else float("nan"),
        pixel_count=int(data_sample.size),
        interpretation=_resolve_interpretation(signature, mean_v),
        bands_used=signature.required_bands,
    )


def process_scene_telemetry(stack: BandStack) -> SceneSpectralSummary:
    """
    Executes the full spectral pipeline across all supported indices,
    computes water extent and flooded-vegetation fractions, and bundles
    the telemetry.
    """
    water_matrix = generate_water_mask(stack)
    flooded_vegetation_matrix = generate_flooded_vegetation_mask(stack)
    
    # Calculate baseline valid pixels (requiring NDWI and MNDWI to exist)
    base_ndwi = execute_index(SpectralSignature.NDWI, stack)
    base_mndwi = execute_index(SpectralSignature.MNDWI, stack)
    valid_domain = stack.valid_mask & np.isfinite(base_ndwi) & np.isfinite(base_mndwi)
    
    domain_pixel_count = int(np.count_nonzero(valid_domain))
    water_pixel_count = int(np.count_nonzero(water_matrix))
    flooded_vegetation_pixel_count = int(np.count_nonzero(flooded_vegetation_matrix & valid_domain))
    
    coverage_ratio = (water_pixel_count / domain_pixel_count) if domain_pixel_count > 0 else 0.0
    flooded_vegetation_ratio = (
        (flooded_vegetation_pixel_count / domain_pixel_count) if domain_pixel_count > 0 else 0.0
    )
    
    computed_metrics = [
        compile_metrics(sig, execute_index(sig, stack), water_matrix)
        for sig in SpectralSignature
    ]
    
    return SceneSpectralSummary(
        metrics=computed_metrics,
        water_coverage_ratio=coverage_ratio,
        flooded_vegetation_ratio=flooded_vegetation_ratio,
    )

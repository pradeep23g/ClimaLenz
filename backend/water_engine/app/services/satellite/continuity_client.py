from __future__ import annotations

import io
import logging
import os
from datetime import datetime, timezone
import httpx
import numpy as np

from app.services.satellite.provider_contracts import (
    ObservationContext,
    ReflectanceCube,
    EarthObservationError,
)

logger = logging.getLogger(__name__)

CONTINUITY_ENGINE_URL = os.getenv("CONTINUITY_ENGINE_URL", "http://localhost:8003")

class ContinuityRetrievalError(EarthObservationError):
    pass

def fetch_reconstructed_raster(job_id: str) -> ObservationContext:
    """
    Fetches the reconstructed array from Continuity Engine's HTTP API.
    Returns an ObservationContext containing a ReflectanceCube.
    """
    url = f"{CONTINUITY_ENGINE_URL}/v1/reconstruction/{job_id}/raster"
    
    try:
        resp = httpx.get(url, timeout=float(os.getenv("WATER_CONTINUITY_TIMEOUT", "60.0")))
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to fetch Continuity raster for job {job_id}: HTTP {e.response.status_code}")
        raise ContinuityRetrievalError(f"HTTP Error {e.response.status_code} from Continuity API")
    except httpx.RequestError as e:
        logger.error(f"Failed to reach Continuity API for job {job_id}: {e}")
        raise ContinuityRetrievalError(f"Could not reach Continuity API: {e}")
        
    try:
        buf = io.BytesIO(resp.content)
        arr = np.load(buf)
    except Exception as e:
        logger.error(f"Failed to parse numpy array from Continuity for job {job_id}: {e}")
        raise ContinuityRetrievalError(f"Invalid array data from Continuity API: {e}")
        
    if arr.shape[0] != 6:
        raise ContinuityRetrievalError(f"Expected 6 bands, got {arr.shape[0]} from Continuity API")
        
    c, h, w = arr.shape
    
    valid_mask = np.ones((h, w), dtype=bool)
    
    cube = ReflectanceCube(
        blue=arr[0],
        green=arr[1],
        red=arr[2],
        red_edge=arr[3],
        nir=arr[4],
        swir=arr[5],
        valid_mask=valid_mask,
        resolution=10.0
    )
    
    # We create a dummy ObservationContext since the actual metadata was returned
    # directly by the Continuity Engine /repair endpoint and the Bridge already has it.
    # The water pipeline mainly cares about the data_cube.
    return ObservationContext(
        data_cube=cube,
        asset_id=f"continuity-{job_id}",
        acquisition_timestamp=datetime.now(timezone.utc),
        cloud_fraction=0.0,  # Reconstructed, so clouds are effectively 0 for the pipeline's purpose
        source_platform="Continuity-Engine",
        extended_metadata={"is_continuity_reconstructed": True}
    )

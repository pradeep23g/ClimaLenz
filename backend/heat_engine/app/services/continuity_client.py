import httpx
import logging
import io
import numpy as np
from typing import List

logger = logging.getLogger(__name__)

import os

CONTINUITY_ENGINE_URL = os.getenv("CONTINUITY_ENGINE_URL", "http://127.0.0.1:8003")

def get_reconstructed_scene(bbox: List[float], start_date: str, end_date: str) -> np.ndarray:
    """
    Calls continuity_engine to reconstruct a scene using SAR-guided U-Net.
    Raises Exception if unreachable or fails (which bubbles up to trigger synthetic noise fallback).
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    geometry = {
        "type": "Polygon",
        "coordinates": [[
            [min_lon, min_lat],
            [max_lon, min_lat],
            [max_lon, max_lat],
            [min_lon, max_lat],
            [min_lon, min_lat]
        ]]
    }

    payload = {
        "geometry": geometry,
        "start_date": start_date,
        "end_date": end_date
    }

    logger.info(f"Calling continuity_engine for reconstruction (dates {start_date} to {end_date})")
    
    with httpx.Client(timeout=float(os.getenv("HEAT_CONTINUITY_TIMEOUT", "60.0"))) as client:
        # 1. Start job and get metadata
        resp = client.post(f"{CONTINUITY_ENGINE_URL}/v1/reconstruction/repair", json=payload)
        resp.raise_for_status()
        
        job_id = resp.json()["job_id"]
        logger.info(f"Continuity Engine job created: {job_id}. Fetching raster...")

        # 2. Fetch the numpy binary
        raster_resp = client.get(f"{CONTINUITY_ENGINE_URL}/v1/reconstruction/{job_id}/raster")
        raster_resp.raise_for_status()
        
        # 3. Deserialize (.npy format)
        buf = io.BytesIO(raster_resp.content)
        arr = np.load(buf)
        return arr

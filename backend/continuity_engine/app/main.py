from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, status

from app.models.reconstruction_schemas import ReconstructionRequest, ReconstructionResponse
from app.pipeline import run_reconstruction
from app.services.model_loader import load_repair_model
from app.services.satellite.base import ContinuityDataError, NoUsableSceneError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import torch
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    torch.set_num_threads(2)
    logger.info("Loading CloudRepairUNet model weights at startup...")
    load_repair_model()
    yield


app = FastAPI(
    title="ClimaLenz Continuity Engine (Layer 0)",
    description=(
        "SAR-guided cloud reconstruction with honest, propagated per-pixel "
        "confidence. Repairs the optical imagery water_engine and "
        "heat_engine depend on, without pretending reconstructed pixels "
        "are as trustworthy as observed ones."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health/status", tags=["Diagnostics"])
def get_system_health() -> dict:
    return {"status": "operational", "service": "climalenz-continuity-engine"}


import uuid
import time
import io
import numpy as np
from fastapi import Response

_IN_MEMORY_RASTER_CACHE = {}
CACHE_TTL_SECONDS = 600

def _cleanup_cache():
    now = time.time()
    expired = [k for k, v in _IN_MEMORY_RASTER_CACHE.items() if now - v["timestamp"] > CACHE_TTL_SECONDS]
    for k in expired:
        del _IN_MEMORY_RASTER_CACHE[k]


@app.post(
    "/v1/reconstruction/repair",
    response_model=ReconstructionResponse,
    tags=["Core Analysis"],
)
def repair_scene(payload: ReconstructionRequest) -> ReconstructionResponse:
    _cleanup_cache()
    try:
        result = run_reconstruction(
            geometry=payload.geometry,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
    except NoUsableSceneError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(err))
    except ContinuityDataError as err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(err))
    except Exception as err:
        logger.exception("Unexpected failure in reconstruction pipeline.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))

    job_id = str(uuid.uuid4())
    _IN_MEMORY_RASTER_CACHE[job_id] = {
        "timestamp": time.time(),
        "array": result["_reconstructed_array"]
    }

    return ReconstructionResponse(
        job_id=job_id,
        optical_scene_id=result["optical_scene_id"],
        sar_scene_id=result["sar_scene_id"],
        provider=result["provider"],
        capture_date=result["capture_date"],
        original_cloud_cover_pct=result["original_cloud_cover_pct"],
        scene_confidence=result["scene_confidence"],
        reconstructed_fraction=result["reconstructed_fraction"],
        low_confidence_fraction=result["low_confidence_fraction"],
        caveats=result["caveats"],
        reconstructed_bands_shape=result["reconstructed_bands_shape"],
    )

@app.get("/v1/reconstruction/{job_id}/raster", tags=["Core Analysis"])
def get_reconstructed_raster(job_id: str):
    entry = _IN_MEMORY_RASTER_CACHE.get(job_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Raster not found or expired.")
    
    # Read without deleting (pop) as requested, rely on age-based cleanup
    arr = entry["array"]
    
    buf = io.BytesIO()
    np.save(buf, arr)
    buf.seek(0)
    
    return Response(content=buf.read(), media_type="application/octet-stream")

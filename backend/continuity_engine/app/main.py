from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, status

from app.models.reconstruction_schemas import ReconstructionRequest, ReconstructionResponse
from app.pipeline import run_reconstruction
from app.services.satellite.base import ContinuityDataError, NoUsableSceneError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ClimaLenz Continuity Engine (Layer 0)",
    description=(
        "SAR-guided cloud reconstruction with honest, propagated per-pixel "
        "confidence. Repairs the optical imagery water_engine and "
        "heat_engine depend on, without pretending reconstructed pixels "
        "are as trustworthy as observed ones."
    ),
    version="0.1.0",
)


@app.get("/health/status", tags=["Diagnostics"])
def get_system_health() -> dict:
    return {"status": "operational", "service": "climalenz-continuity-engine"}


@app.post(
    "/v1/reconstruction/repair",
    response_model=ReconstructionResponse,
    tags=["Core Analysis"],
)
def repair_scene(payload: ReconstructionRequest) -> ReconstructionResponse:
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

    return ReconstructionResponse(
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

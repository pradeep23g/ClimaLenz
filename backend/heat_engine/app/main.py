from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, status

from app.models.simulation_schemas import SimulationRequest, SimulationResponse
from app.pipeline import run_inference_pipeline
from app.services.satellite.client_factory import resolve_thermal_client

# Configure basic logging for Cloud Run stdout compatibility
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import torch
from contextlib import asynccontextmanager
from app.services.model_loader import load_pinn, load_baseline

@asynccontextmanager
async def lifespan(app: FastAPI):
    torch.set_num_threads(2)
    logger.info("Loading PINN model weights at startup...")
    load_pinn()
    try:
        load_baseline()
    except Exception as e:
        logger.warning(f"Baseline model unavailable at startup: {e}")
    yield

app = FastAPI(
    title="ClimaLenz Heat Engine API",
    description="Physics-informed urban heat intervention simulator (PINN + thermodynamic guardrail).",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health/status", tags=["Diagnostics"])
def get_system_health() -> dict:
    """Liveness probe for Cloud Run / load balancer orchestration."""
    return {
        "status": "operational",
        "service": "climalenz-heat-engine",
        "environment": "production",
    }


@app.post(
    "/v1/simulations/what-if",
    response_model=SimulationResponse,
    tags=["Core Simulation"],
)
def run_what_if_simulation(payload: SimulationRequest) -> SimulationResponse:
    """
    Fetches (or synthesizes, depending on CLIMALENZ_LOCAL_MOCK_API) the
    current thermal/vegetation/landcover state for the requested AOI, then
    runs the trained PINN forward under the requested micro-climate
    intervention, validated against the physicist guardrail.
    """
    try:
        client = resolve_thermal_client()
        x_test_array, y_real_array, ndvi_grid, landcover_grid, land_mask, data_provenance = client.build_inference_arrays(
            bbox=payload.bbox,
            date_range=payload.date_range,
        )

        result = run_inference_pipeline(
            x_test_array=x_test_array,
            y_real_array=y_real_array,
            ndvi_grid=ndvi_grid,
            landcover_grid=landcover_grid,
            land_mask=land_mask,
            intervention_type=payload.intervention_type.value,
            delta=payload.delta,
        )

        return SimulationResponse(
            intervention_type=result["intervention_type"],
            delta=result["delta"],
            guardrail_status=result["guardrail_status"],
            details=result["details"],
            delta_t_grid=result["delta_T_grid"].tolist(),
            data_provenance=data_provenance,
            visualization_base64=result.get("visualization_base64"),
        )

    except FileNotFoundError as missing_artifact:
        logger.error(f"Trained model artifact missing: {missing_artifact}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "PINN model weights not found. Run training/train_baseline.py "
                "then training/train_pinn.py to produce artifacts/pinn_model.pt first."
            ),
        )
    except ValueError as validation_err:
        logger.error(f"Pipeline validation error: {validation_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pipeline constraints violated: {str(validation_err)}",
        )
    except Exception:
        logger.exception("Catastrophic heat engine pipeline failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal computational error occurred during the heat simulation.",
        )

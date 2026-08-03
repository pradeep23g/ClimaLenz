import logging
import torch
import numpy as np

from app.services.model_loader import load_pinn, load_baseline
from app.services.what_if_engine import run_what_if
from app.services.visualization import generate_comparison_plot
from training.dataset import prepare_dataloaders

# Set up standard backend logging
logger = logging.getLogger(__name__)

def run_simulation_pipeline(
    lst_stack: np.ndarray, 
    ndvi_grid: np.ndarray, 
    landcover_grid: np.ndarray, 
    land_mask: np.ndarray, 
    intervention_type: str = "CANOPY", 
    delta: float = 0.15
) -> dict:
    """
    Orchestrates the end-to-end ClimaLenz simulation pipeline:
    1. Prepares data loaders
    2. Loads the trained PINN model
    3. Executes the what-if intervention simulation
    4. Evaluates against the physicist guardrail
    5. Renders the baseline-vs-PINN-vs-reality comparison plot
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Running pipeline on device: {device}")

    # 1. Prepare data loaders from arrays
    _, val_loader = prepare_dataloaders(lst_stack, ndvi_grid, landcover_grid, land_mask, batch_size=4)
    
    # 2. Grab a test sample from validation loader — keep the ground truth
    # target this time (previously discarded as `_`), since it's needed to
    # render the comparison plot against real satellite reality.
    try:
        x_test, y_test = next(iter(val_loader))
        sample_input = x_test[0:1].to(device)
        y_real = y_test[0, 0].cpu().numpy()  # (H, W) ground truth for the same sample
    except Exception as e:
        logger.error(f"Failed to fetch sample from validation loader: {e}")
        raise ValueError("Validation loader is empty or improperly formatted.")

    # 3. Load both trained models. The baseline is only needed for the
    # comparison visualization (it plays no role in the actual simulation
    # or guardrail check below) — if its weights aren't available yet,
    # don't fail the whole request over a missing image.
    logger.info("Loading PINN model weights for simulation...")
    pinn_model = load_pinn().to(device)

    baseline_model = None
    try:
        baseline_model = load_baseline().to(device)
    except Exception as e:
        logger.warning(f"Baseline model unavailable, skipping comparison plot: {e}")

    # 4. Run the Realistic What-If Intervention
    logger.info(f"--- Testing {intervention_type} Intervention (delta={delta}) ---")
    result = run_what_if(
        model=pinn_model, 
        baseline_input=sample_input, 
        intervention_type=intervention_type, 
        delta=delta
    )

    # Format the response for the API / Frontend
    status = result["guardrail"]["status"]
    reason = result["guardrail"].get("reason", "Within safe cooling limits!")
    
    logger.info(f"Guardrail Status: {status}")
    logger.info(f"Details: {reason}")

    # 5. Render the baseline-vs-PINN-vs-reality comparison plot — this is
    # the actual demo proof (baseline's physically implausible error vs
    # the PINN staying bounded), not just decoration.
    visualization_base64 = None
    if baseline_model is not None:
        try:
            visualization_base64 = generate_comparison_plot(
                x_single=sample_input,
                y_real=y_real,
                baseline_model=baseline_model,
                pinn_model=pinn_model,
                device=device,
            )
        except Exception as e:
            logger.warning(f"Comparison plot generation failed: {e}")

    return {
        "intervention_type": intervention_type,
        "delta": delta,
        "guardrail_status": status,
        "details": reason,
        "delta_T_grid": result["delta_T_grid"],
        "visualization_base64": visualization_base64,
    }
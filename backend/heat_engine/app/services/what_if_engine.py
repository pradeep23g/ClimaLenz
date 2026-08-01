import logging
import torch
import numpy as np
from typing import Dict, Any, Optional

from app.services.physics_guardrail import physicist_agent

# Set up standard backend logging
logger = logging.getLogger(__name__)

def run_what_if(
    model: torch.nn.Module, 
    baseline_input: torch.Tensor, 
    intervention_type: str, 
    delta: float = 0.2
) -> Dict[str, Any]:
    """
    Simulates a microclimate intervention by modifying input features 
    and passing them through the PINN, then validating via the physicist agent.
    
    baseline_input: (1, 3, H, W) tensor - [LST, NDVI, landcover]
    delta: how much to bump NDVI/albedo for the intervention
    """
    logger.info(f"Running What-If simulation for {intervention_type} with delta={delta}...")
    
    # Clone tensor so we don't mutate the original baseline in memory
    modified = baseline_input.clone()
    
    if intervention_type in ("CANOPY", "ALBEDO_CHANGE"):
        modified[:, 1:2, :, :] += delta # Bump the NDVI channel (channel index 1)

    model.eval()
    with torch.no_grad():
        baseline_pred = model(baseline_input)
        simulated_pred = model(modified)

    # Compute temperature delta grid (Simulated minus Baseline)
    delta_T = (simulated_pred - baseline_pred).squeeze().cpu().numpy()
    
    # Run the physics guardrail check
    guardrail_result = physicist_agent(delta_T, intervention_type)

    logger.info(f"What-If complete. Guardrail status: {guardrail_result['status']}")

    return {
        "delta_T_grid": delta_T,
        "guardrail": guardrail_result,
    }
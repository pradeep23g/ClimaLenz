import torch
import numpy as np

from app.services.model_loader import load_pinn
from app.services.what_if_engine import run_what_if
from training.dataset import prepare_dataloaders

def run_system_stress_test(lst_stack, ndvi_grid, landcover_grid, land_mask):
    """
    Injects an impossible delta=5.0 NDVI anomaly to verify 
    that the physicist_agent catches thermodynamic collapse and flags it.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Running Stress Test on device: {device}")

    # 1. Prepare data loaders and grab a test sample
    _, val_loader = prepare_dataloaders(lst_stack, ndvi_grid, landcover_grid, land_mask, batch_size=4)
    x_test, _ = next(iter(val_loader))
    sample_input = x_test[0:1].to(device)

    # 2. Load the trained PINN model
    pinn_model = load_pinn().to(device)

    # 3. Execute the Stress Test (delta=5.0)
    print("\n--- Testing ANOMALY Canopy Intervention (delta=5.0) ---")
    extreme_result = run_what_if(
        model=pinn_model, 
        baseline_input=sample_input, 
        intervention_type="CANOPY", 
        delta=5.0
    )

    # 4. Evaluate Guardrail Response
    status = extreme_result['guardrail']['status']
    print(f"Guardrail Status: {status}")
    
    if status == 'FLAGGED':
        reason = extreme_result['guardrail']['reason']
        print(f"🛑 Caught by Physics Engine: {reason}")
    else:
        reason = extreme_result['guardrail'].get("reason", "Passed")
        print("Details:", reason)
        
    return extreme_result

if __name__ == "__main__":
    print("Run this script with loaded arrays to verify the physics guardrail!")
import logging
import numpy as np
from typing import Dict, Optional, Any

# Set up standard backend logging
logger = logging.getLogger(__name__)

def physicist_agent(
    delta_T_grid: np.ndarray, 
    intervention_type: str, 
    max_bounds: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Validates simulated temperature drops against known physical thermodynamic limits.
    delta_T_grid: (H, W) array - simulated minus baseline temperature
    intervention_type: 'CANOPY' | 'COOL_ROOF' | 'ALBEDO_CHANGE'
    """
    max_bounds = max_bounds or {
        "CANOPY": 4.0,       # published UHI literature: canopy cooling caps -3-4°C
        "COOL_ROOF": 3.0,
        "ALBEDO_CHANGE": 5.0,
    }
    
    # Failsafe: if the frontend sends a typo or unknown intervention
    if intervention_type not in max_bounds:
        logger.warning(f"Unknown intervention '{intervention_type}', defaulting to 5.0°C limit.")
        limit = 5.0
    else:
        limit = max_bounds[intervention_type]
        
    violations = np.abs(delta_T_grid) > limit

    if violations.any():
        violation_count = violations.sum()
        logger.warning(f"🛑 GUARDRAIL TRIGGERED: {violation_count} pixels violated {intervention_type} physics.")
        return {
            "status": "FLAGGED",
            "reason": f"{violation_count} pixels exceeded {limit}°C bound for {intervention_type}",
            "confidence": "low",
        }
        
    logger.info(f"✅ Guardrail PASSED for {intervention_type}.")
    return {"status": "PASSED", "confidence": "high"}
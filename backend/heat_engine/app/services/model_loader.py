import torch
from pathlib import Path
from app.services.model_arch import ThermalCNN

ARTIFACTS_DIR = Path(__file__).parent.parent.parent / "artifacts"

def load_model(filename: str) -> ThermalCNN:
    model = ThermalCNN()
    model.load_state_dict(torch.load(ARTIFACTS_DIR / filename, weights_only=True))
    model.eval()
    return model

def load_baseline() -> ThermalCNN:
    return load_model("baseline_cnn.pt")

def load_pinn() -> ThermalCNN:
    return load_model("pinn_model.pt")
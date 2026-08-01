import torch
from pathlib import Path
import torch.nn.functional as F

# Import the architecture and physics operator from your other files
from app.services.model_arch import ThermalCNN
from training.laplacian import compute_laplacian

def train_pinn_model(train_loader, val_loader, land_mask, epochs=30, lambda_weight=0.1):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training PINN on device: {device}")

    # Set up safe paths for your model weights
    artifacts_dir = Path(__file__).parent.parent / "artifacts"
    baseline_path = artifacts_dir / "baseline_cnn.pt"
    save_path = artifacts_dir / "pinn_model.pt"

    # Convert land_mask to a GPU tensor for the loss function
    mask_tensor = torch.tensor(land_mask, device=device).unsqueeze(0).unsqueeze(0) # Shape: (1, 1, H, W)

    # Initialize model
    pinn_model = ThermalCNN().to(device)
    
    # Safely load the baseline weights
    if baseline_path.exists():
        print(f"Loading baseline weights from {baseline_path}...")
        pinn_model.load_state_dict(torch.load(baseline_path, map_location=device, weights_only=True))
    else:
        print(f"⚠️ WARNING: Baseline weights not found at {baseline_path}. Make sure train_baseline.py ran first!")

    pinn_opt = torch.optim.Adam(pinn_model.parameters(), lr=1e-4)

    print("Starting Honest PINN Training with Dynamic Land Cover Physics...")
    for epoch in range(epochs):
        pinn_model.train()
        train_loss = 0.0

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            pinn_opt.zero_grad()

            pred_T = pinn_model(x)

            # Data loss applied only over land mask
            loss_data = torch.mean(((pred_T - y) * mask_tensor) ** 2)

            # Physics residual over land
            T_today = x[:, 0:1, :, :]
            lc_today = x[:, 2:3, :, :] # Extract the Land Cover channel
            
            # --- DYNAMIC THERMAL DIFFUSIVITY (ALPHA) ---
            alpha_grid = torch.ones_like(lc_today) * 0.05 # Default baseline
            alpha_grid[lc_today == 50] = 0.12 # Urban/Built-up: Concrete heats & cools rapidly
            alpha_grid[lc_today == 10] = 0.03 # Trees/Canopy: Retains microclimate, slow diffusion
            alpha_grid[lc_today == 80] = 0.01 # Water: Massive heat sink, slowest diffusion

            dT_dt = pred_T - T_today
            lap = compute_laplacian(pred_T)

            # alpha_grid now alters diffusion rate pixel-by-pixel!
            physics_residual = (dT_dt - (alpha_grid * lap)) * mask_tensor
            loss_phys = torch.mean(physics_residual ** 2)

            loss = loss_data + (lambda_weight * loss_phys)
            loss.backward()
            pinn_opt.step()
            train_loss += loss.item()

        # Evaluate on Validation Set (Unseen Data!)
        pinn_model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for x_val, y_val in val_loader:
                x_val, y_val = x_val.to(device), y_val.to(device)
                pred_val = pinn_model(x_val)
                v_loss = torch.mean(((pred_val - y_val) * mask_tensor) ** 2)
                val_loss += v_loss.item()

        print(f"Epoch {epoch+1}/{epochs} - Train Loss: {train_loss/len(train_loader):.3f} | Val Loss (Unseen): {val_loss/len(val_loader):.3f}")

    # Save the final physics-informed brain
    torch.save(pinn_model.state_dict(), save_path)
    print(f"✅ Honest PINN successfully trained and saved to {save_path}!")
    
    return pinn_model
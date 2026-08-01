import torch
import torch.nn.functional as F
from pathlib import Path

# Import the architecture from your services layer
from app.services.model_arch import ThermalCNN

def train_baseline_model(train_loader, epochs=30):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training Baseline CNN on device: {device}")

    # Initialize model and optimizer
    model = ThermalCNN().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)

    print("Starting Baseline CNN Training...")
    for epoch in range(epochs):
        total_loss = 0
        for x, y in train_loader: 
            x, y = x.to(device), y.to(device) # Pushing data to the GPU
            opt.zero_grad()
            
            pred = model(x)
            loss = F.mse_loss(pred, y)
            
            loss.backward()
            opt.step()
            total_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{epochs} - Loss: {total_loss/len(train_loader):.4f}")

    # Safely route the saved weights to the artifacts directory
    artifacts_dir = Path(__file__).parent.parent / "artifacts"
    artifacts_dir.mkdir(exist_ok=True) # Failsafe just in case the folder doesn't exist
    save_path = artifacts_dir / "baseline_cnn.pt"
    
    torch.save(model.state_dict(), save_path)
    print(f"✅ Baseline CNN successfully trained and saved to {save_path}!")
    
    return model

# This block allows you to run the file directly from the terminal if needed
if __name__ == "__main__":
    print("Run this via your pipeline orchestrator to pass the train_loader!")
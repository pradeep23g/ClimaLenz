import torch
import base64
import io
import numpy as np
import matplotlib
# MUST use 'Agg' backend to prevent crashes on serverless environments!
matplotlib.use('Agg') 
import matplotlib.pyplot as plt

def generate_comparison_plot(x_single, y_real, baseline_model, pinn_model, device):
    """
    Generates a 4-panel comparison plot (Baseline, PINN, Ground Truth, Error Map),
    saves it to an invisible memory buffer, and returns it as a Base64 string for the API.
    """
    
    # 1. Get Predictions
    baseline_model.eval()
    pinn_model.eval()
    
    with torch.no_grad():
        pred_base = baseline_model(x_single)[0, 0].cpu().numpy()
        pred_pinn = pinn_model(x_single)[0, 0].cpu().numpy()

    # 2. Calculate the Error Maps (Absolute difference from reality)
    error_base = np.abs(pred_base - y_real)
    error_pinn = np.abs(pred_pinn - y_real)

    # 3. Setup the Figure
    fig, axes = plt.subplots(1, 4, figsize=(24, 5))
    vmin = min(y_real.min(), pred_base.min(), pred_pinn.min())
    vmax = max(y_real.max(), pred_base.max(), pred_pinn.max())

    # Plot 1: Baseline
    ax1 = axes[0].imshow(pred_base, cmap='magma', vmin=vmin, vmax=vmax)
    axes[0].set_title("Baseline CNN (Physics-Blind)")
    plt.colorbar(ax1, ax=axes[0], fraction=0.046, pad=0.04, label="Celsius")

    # Plot 2: PINN
    ax2 = axes[1].imshow(pred_pinn, cmap='magma', vmin=vmin, vmax=vmax)
    axes[1].set_title("ClimaLenz PINN (Thermodynamics Enforced)")
    plt.colorbar(ax2, ax=axes[1], fraction=0.046, pad=0.04, label="Celsius")

    # Plot 3: Ground Truth
    ax3 = axes[2].imshow(y_real, cmap='magma', vmin=vmin, vmax=vmax)
    axes[2].set_title("Actual Satellite Reality")
    plt.colorbar(ax3, ax=axes[2], fraction=0.046, pad=0.04, label="Celsius")
    
    # Plot 4: The Flex (Error Map)
    # Using a 'Reds' colormap: Dark red means high error, white means perfect prediction
    ax4 = axes[3].imshow(error_base - error_pinn, cmap='RdBu', vmin=-3, vmax=3)
    axes[3].set_title("Error Delta (Red = CNN Failed, Blue = PINN Failed)")
    plt.colorbar(ax4, ax=axes[3], fraction=0.046, pad=0.04, label="Delta Celsius")

    plt.tight_layout()

    # 4. Save to Memory Buffer and Encode
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
    plt.close(fig) # Crucial: Close the figure to prevent server memory leaks!
    
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return image_base64
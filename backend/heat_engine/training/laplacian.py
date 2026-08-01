import torch
import torch.nn.functional as F

def compute_laplacian(T: torch.Tensor) -> torch.Tensor:
    """
    Standard 3x3 Laplacian kernel for spatial heat diffusion.
    Approximates the second spatial derivative: d2T/dx2 + d2T/dy2
    """
    kernel = torch.tensor([[[[0., 1., 0.],
                             [1., -4., 1.],
                             [0., 1., 0.]]]], device=T.device)
                             
    return F.conv2d(T, kernel, padding=1)
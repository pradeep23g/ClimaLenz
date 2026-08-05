import torch
import numpy as np
from torch.utils.data import Dataset, DataLoader, Subset
from typing import Tuple

class GridLSTDataset(Dataset):
    def __init__(self, lst_stack, ndvi_grid, landcover_grid, land_mask):
        self.lst = lst_stack
        self.ndvi = ndvi_grid
        self.lc = landcover_grid
        self.mask = land_mask

    def __len__(self):
        return self.lst.shape[0] - 1

    def __getitem__(self, idx):
        # Input x: Today's LST + NDVI + LandCover -> Shape: (3, H, W)
        x = np.stack([self.lst[idx], self.ndvi, self.lc], axis=0)
        # Target y: Tomorrow's LST -> Shape: (1, H, W)
        y = self.lst[idx + 1][None, ...]
        return torch.tensor(x, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)

def prepare_dataloaders(
    lst_stack: np.ndarray, 
    ndvi_grid: np.ndarray, 
    landcover_grid: np.ndarray, 
    land_mask: np.ndarray, 
    batch_size: int = 4
) -> Tuple[DataLoader, DataLoader]:
    """
    Creates the dataset and enforces the strict chronological split 
    (no time-leakage) for training and validation.
    """
    full_dataset = GridLSTDataset(lst_stack, ndvi_grid, landcover_grid, land_mask)

    # --- STRICT CHRONOLOGICAL SPLIT ---
    total_samples = len(full_dataset)
    train_size = max(1, min(total_samples - 1, int(0.8 * total_samples))) if total_samples > 1 else 1
    
    # Slice by index so Time (Day 1 -> Day N) is preserved
    train_dataset = Subset(full_dataset, range(0, train_size))
    val_dataset = Subset(full_dataset, range(train_size, total_samples))

    # Create DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    print(f"Train sequences (Past): {len(train_dataset)} | Validation sequences (Future): {len(val_dataset)}")
    
    return train_loader, val_loader
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend" / "heat_engine"))

# Ensure Live Mode
os.environ["CLIMALENZ_LOCAL_MOCK_API"] = "0"

from app.services.satellite.planetary_thermal_client import PlanetaryThermalClient, _get_item_datetime
from app.services.preprocessing import DEFAULT_BBOX, DEFAULT_GRID
from app.pipeline import run_simulation_pipeline


def main():
    print("\n" + "=" * 75)
    print("🔥 HEAT ENGINE FINE-GRAINED LIVE TIMING BENCHMARK")
    print("=" * 75)
    
    bbox = DEFAULT_BBOX
    date_range = "2026-07-01/2026-07-31"
    
    print(f"Target Bounding Box: {bbox}")
    print(f"Target Date Range:   {date_range}\n")

    client = PlanetaryThermalClient()

    # -------------------------------------------------------------
    # Breakpoint 1 & 2: STAC Search + Download & Scene Metadata Count
    # -------------------------------------------------------------
    print("📡 Step 1: STAC Search & Scene Retrieval...")
    t_stac_search_0 = time.time()
    modis_items = client.fetch_modis_data(bbox=bbox, date_range=date_range)
    t_stac_search_s = time.time() - t_stac_search_0
    
    scene_count = len(modis_items)
    date_min = _get_item_datetime(modis_items[0]).strftime("%Y-%m-%d")
    date_max = _get_item_datetime(modis_items[-1]).strftime("%Y-%m-%d")
    print(f"   └─ MODIS Search Completed in {t_stac_search_s:.4f}s")
    print(f"   └─ Fetched {scene_count} daily MODIS scenes from [{date_min}] to [{date_max}]")

    print("\n📥 Step 2: Downloading & Regridding Remote Rasters (MODIS + S2 + ESA WorldCover)...")
    t_download_0 = time.time()
    lst_stack, ndvi_grid, landcover_grid, land_mask, _ = client.build_training_arrays(
        bbox=bbox,
        date_range=date_range,
        grid_shape=DEFAULT_GRID,
    )
    t_download_s = time.time() - t_download_0
    print(f"   └─ Scene Rasters Downloaded & Regridded in {t_download_s:.4f}s")

    # -------------------------------------------------------------
    # Breakpoint 3: Preprocessing
    # -------------------------------------------------------------
    print("\n⚙️ Step 3: Preprocessing (Tensor creation & DataLoader prep)...")
    t_prep_0 = time.time()
    from training.dataset import prepare_dataloaders
    _, val_loader = prepare_dataloaders(lst_stack, ndvi_grid, landcover_grid, land_mask, batch_size=4)
    x_test, _ = next(iter(val_loader))
    sample_input = x_test[0:1]
    t_prep_s = time.time() - t_prep_0
    print(f"   └─ Preprocessing Completed in {t_prep_s:.4f}s")

    # -------------------------------------------------------------
    # Breakpoint 4: Model Inference
    # -------------------------------------------------------------
    print("\n🧠 Step 4: Model Inference (PyTorch PINN Forward Pass & Guardrails)...")
    t_inf_0 = time.time()
    result = run_simulation_pipeline(
        lst_stack=lst_stack,
        ndvi_grid=ndvi_grid,
        landcover_grid=landcover_grid,
        land_mask=land_mask,
        intervention_type="CANOPY",
        delta=0.15,
    )
    t_inf_s = time.time() - t_inf_0
    print(f"   └─ Model Inference & Guardrails Completed in {t_inf_s:.4f}s")

    print("\n" + "=" * 75)
    print("📊 EXACT TIMING BREAKDOWN RESULTS")
    print("=" * 75)
    print(f"  1. MODIS / STAC Search Time:         {t_stac_search_s:.4f}s")
    print(f"  2. Scene Downloads & Raster Read:    {t_download_s:.4f}s")
    print(f"     • Scene Count:                    {scene_count} scenes")
    print(f"     • Date Range Fetched:             {date_min} to {date_max}")
    print(f"  3. Preprocessing & Tensor Prep:      {t_prep_s:.4f}s")
    print(f"  4. Actual PINN Model Inference:      {t_inf_s:.4f}s")
    print(f"  -------------------------------------------------------------")
    print(f"  TOTAL HEAT ENGINE PIPELINE TIME:     {t_stac_search_s + t_download_s + t_prep_s + t_inf_s:.4f}s")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()

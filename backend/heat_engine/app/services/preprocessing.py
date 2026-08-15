import logging
import numpy as np
import rioxarray
from pyproj import Transformer
from typing import List, Optional, Tuple, Any

# Set up standard backend logging
logger = logging.getLogger(__name__)

# Default constants (can be dynamically overridden by API requests)
DEFAULT_BBOX = [80.15, 12.98, 80.29, 13.11]  # Chennai AOI
DEFAULT_GRID = (64, 64)

def get_bbox_in_raster_crs(da, bbox_4326: List[float]) -> List[float]:
    """
    Transforms a standard lat/lon bounding box (EPSG:4326) 
    into the native coordinate reference system (CRS) of the satellite raster.
    """
    transformer = Transformer.from_crs("EPSG:4326", da.rio.crs, always_xy=True)
    minx, miny = transformer.transform(bbox_4326[0], bbox_4326[1])
    maxx, maxy = transformer.transform(bbox_4326[2], bbox_4326[3])
    return [minx, miny, maxx, maxy]

import rasterio

def load_and_regrid_item(
    item: Any, 
    bbox: List[float] = DEFAULT_BBOX, 
    grid_shape: Tuple[int, int] = DEFAULT_GRID,
    asset_key: str = "LST_Day_1km"
) -> Optional[np.ndarray]:
    """
    Downloads, clips, reprojects, and normalizes a single STAC item's thermal raster.
    """
    try:
        with rasterio.Env(GDAL_HTTP_TIMEOUT="15", GDAL_HTTP_MAX_RETRY="2"):
            da = rioxarray.open_rasterio(item.assets[asset_key].href)
            bbox_native = get_bbox_in_raster_crs(da, bbox)
            da = da.rio.clip_box(*bbox_native, allow_one_dimensional_raster=True)
            da = da.rio.reproject("EPSG:4326", shape=grid_shape)

        raw = da.values.squeeze()
        valid_mask = raw > 0

        # Physical conversion to Celsius
        arr = raw * 0.02 - 273.15
        arr[~valid_mask] = np.nan

        # Relaxed to 0.9 (90%) so we don't drop the scene just because of the ocean
        if np.isnan(arr).mean() > 0.9:
            return None

        # Fill the ocean/clouds with the city's spatial average temp for that day
        arr = np.nan_to_num(arr, nan=np.nanmean(arr))

        return arr.astype("float32")
        
    except Exception as e:
        logger.error(f"Error processing item {item.id}: {e}")
        return None

def build_lst_stack(
    signed_items: List[Any], 
    bbox: List[float], 
    grid_shape: Tuple[int, int] = DEFAULT_GRID,
    date_range: str = "2026-07-01/2026-07-31"
) -> Tuple[np.ndarray, str]:
    """
    Given a list of signed STAC items for LST (e.g. MOD11A1), loads the 
    underlying raster data, regrids them to the target shape, and stacks 
    them into a single 3D array (time, height, width).
    Returns (stack, provenance_string).
    """
    logger.info(f"Processing {len(signed_items)} scenes into a {grid_shape} grid...")
    
    scanned = [load_and_regrid_item(it, bbox, grid_shape) for it in signed_items]
    
    # Filter out None values from failed reads
    valid_arrays = [arr for arr in scanned if arr is not None]
    
    provenance = "live"

    if not valid_arrays:
        logger.warning("All live MODIS scenes were cloud-obscured. Falling back to regional baseline LST grid.")
        baseline = np.full(grid_shape, 32.0, dtype="float32") + np.random.normal(0, 0.5, grid_shape).astype("float32")
        valid_arrays = [baseline + np.random.normal(0, 0.1, grid_shape).astype("float32") for _ in range(5)]
        provenance = "synthetic_fallback"
    elif len(valid_arrays) < 5:
        # Pad small LST stacks to at least 5 scenes using Continuity Engine.
        logger.info(f"Padding {len(valid_arrays)} valid scenes to 5 scenes using Continuity Engine.")
        from app.services.continuity_client import get_reconstructed_scene
        try:
            start_date, end_date = date_range.split("/")
        except ValueError:
            start_date, end_date = "2026-07-01", "2026-07-31"
            
        used_synthetic = False
        used_continuity = False

        while len(valid_arrays) < 5:
            try:
                recon = get_reconstructed_scene(bbox, start_date, end_date)
                if recon.shape != grid_shape:
                    logger.warning(f"Reconstructed shape {recon.shape} != {grid_shape}, falling back to synthetic.")
                    raise ValueError("Shape mismatch")
                valid_arrays.append(recon.astype("float32"))
                used_continuity = True
                logger.info("Successfully fetched and appended reconstructed scene.")
            except Exception as e:
                logger.error(f"Continuity engine repair failed ({e}). Falling back to true last-resort synthetic padding.")
                last_scene = valid_arrays[-1]
                valid_arrays.append(last_scene + np.random.normal(0, 0.1, grid_shape).astype("float32"))
                used_synthetic = True
        
        if used_synthetic:
            provenance = "synthetic_fallback"
        elif used_continuity:
            provenance = "continuity_reconstructed"
        
    lst_stack = np.stack(valid_arrays)
    logger.info(f"Successfully built CLEAN LST Stack shape: {lst_stack.shape}, provenance: {provenance}")
    
    return lst_stack, provenance

def build_inference_input(
    signed_items: List[Any], 
    bbox: List[float], 
    grid_shape: Tuple[int, int] = DEFAULT_GRID,
    date_range: str = "2026-07-01/2026-07-31"
) -> Tuple[np.ndarray, np.ndarray, str]:
    """
    Minimal scene fetcher strictly for live inference (skips dataloaders).
    Pulls exactly 2 scenes: today (x_test) and tomorrow (y_real), applies
    Continuity Engine repair only if they are clouded, and evaluates provenance.
    Returns (x_test_array, y_real_array, provenance_string).
    """
    # Grab the last two available scenes chronologically (today and tomorrow)
    # or the only two scenes if the list is small.
    target_items = signed_items[-2:] if len(signed_items) >= 2 else signed_items
    logger.info(f"Processing up to 2 scenes for inference into a {grid_shape} grid...")

    def get_date_str(item) -> str:
        if hasattr(item, "datetime") and item.datetime:
            return item.datetime.strftime("%Y-%m-%d")
        if hasattr(item, "properties") and "datetime" in item.properties:
            return item.properties["datetime"][:10]
        # Fallback to general range if missing
        return date_range.split("/")[0] if "/" in date_range else "2026-07-01"

    # Pair each item with its date and processed array
    processed = []
    for item in target_items:
        date_str = get_date_str(item)
        arr = load_and_regrid_item(item, bbox, grid_shape)
        processed.append({"date": date_str, "array": arr})

    def fetch_fallback(date_str: str, slot_name: str) -> Tuple[np.ndarray, str]:
        # Tries continuity, falls back to synthetic
        logger.info(f"Padding {slot_name} (date {date_str}) using Continuity Engine.")
        from app.services.continuity_client import get_reconstructed_scene
        
        # Continuity Engine needs a window to find a Sentinel-2 pass (5-day revisit cycle)
        # Pad +/- 3 days around the target date to ensure an optical scene exists to repair
        from datetime import datetime, timedelta
        target_dt = datetime.strptime(date_str, "%Y-%m-%d")
        window_start = (target_dt - timedelta(days=3)).strftime("%Y-%m-%d")
        window_end = (target_dt + timedelta(days=3)).strftime("%Y-%m-%d")
        
        try:
            recon = get_reconstructed_scene(bbox, window_start, window_end)
            if recon.shape != grid_shape:
                raise ValueError("Shape mismatch")
            logger.info(f"Successfully fetched reconstructed scene for target {date_str}.")
            return recon.astype("float32"), "continuity_reconstructed"
        except Exception as e:
            logger.error(f"Continuity engine repair failed ({e}). Falling back to synthetic.")
            # For purely synthetic fallback on individual scene, use 32.0 baseline + noise
            baseline = np.full(grid_shape, 32.0, dtype="float32") + np.random.normal(0, 0.5, grid_shape).astype("float32")
            return baseline, "synthetic_fallback"

    x_prov = "live"
    y_prov = "live"

    if len(processed) >= 2:
        x_info = processed[0]
        y_info = processed[1]
    elif len(processed) == 1:
        x_info = processed[0]
        # Fake a next day for y_info if we only have one item
        y_info = {"date": date_range.split("/")[-1] if "/" in date_range else "2026-07-31", "array": None}
    else:
        d1, d2 = ("2026-07-01", "2026-07-02")
        if "/" in date_range:
            parts = date_range.split("/")
            d1 = parts[0]
            d2 = parts[-1]
        x_info = {"date": d1, "array": None}
        y_info = {"date": d2, "array": None}

    if x_info["array"] is not None:
        x_test_arr = x_info["array"]
    else:
        x_test_arr, x_prov = fetch_fallback(x_info["date"], "x_test")

    if y_info["array"] is not None:
        y_real_arr = y_info["array"]
    else:
        y_real_arr, y_prov = fetch_fallback(y_info["date"], "y_real")

    # Worst-case wins
    provenances = {x_prov, y_prov}
    if "synthetic_fallback" in provenances:
        provenance = "synthetic_fallback"
    elif "continuity_reconstructed" in provenances:
        provenance = "continuity_reconstructed"
    else:
        provenance = "live"

    logger.info(f"Successfully built Inference input. Provenance: {provenance}")
    return x_test_arr, y_real_arr, provenance

def generate_ndvi_grid(
    s2_item: Any, 
    grid_shape: Tuple[int, int] = DEFAULT_GRID
) -> np.ndarray:
    """
    Downloads Red and NIR bands from Sentinel-2, regrids them, and calculates NDVI.
    """
    logger.info("Regridding Sentinel-2 bands to calculate true NDVI...")
    try:
        with rasterio.Env(GDAL_HTTP_TIMEOUT="15", GDAL_HTTP_MAX_RETRY="2"):
            red_da = rioxarray.open_rasterio(s2_item.assets["B04"].href).rio.reproject("EPSG:4326", shape=grid_shape)
            nir_da = rioxarray.open_rasterio(s2_item.assets["B08"].href).rio.reproject("EPSG:4326", shape=grid_shape)

        red = red_da.values.squeeze().astype(float)
        nir = nir_da.values.squeeze().astype(float)

        # Calculate real NDVI: (NIR - Red) / (NIR + Red)
        ndvi_grid = np.clip((nir - red) / (nir + red + 1e-8), -1, 1).astype("float32")
        ndvi_grid = np.nan_to_num(ndvi_grid, nan=0.0)
        
        logger.info(f"NDVI shape: {ndvi_grid.shape} | Range: {ndvi_grid.min():.2f} to {ndvi_grid.max():.2f}")
        return ndvi_grid
    except Exception as e:
        logger.error(f"Failed to generate NDVI grid: {e}")
        return np.zeros(grid_shape, dtype="float32")

def generate_landcover_and_mask(
    wc_item: Any, 
    grid_shape: Tuple[int, int] = DEFAULT_GRID
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Downloads ESA Worldcover, regrids it, and generates a binary land/water mask.
    Class 80 is permanent water.
    """
    logger.info("Regridding ESA WorldCover for real water mask...")
    try:
        with rasterio.Env(GDAL_HTTP_TIMEOUT="15", GDAL_HTTP_MAX_RETRY="2"):
            wc_da = rioxarray.open_rasterio(wc_item.assets["map"].href).rio.reproject("EPSG:4326", shape=grid_shape)
        landcover_grid = wc_da.values.squeeze().astype("float32")

        # Create Dynamic Water Mask
        land_mask = np.ones(grid_shape, dtype="float32")
        land_mask[landcover_grid == 80] = 0.0  # 1 for land, 0 for actual water
        
        logger.info(f"Landcover shape: {landcover_grid.shape} | Real water pixels detected: {(land_mask == 0).sum()}")
        return landcover_grid, land_mask
    except Exception as e:
        logger.error(f"Failed to generate Landcover grid: {e}")
        return np.zeros(grid_shape, dtype="float32"), np.ones(grid_shape, dtype="float32")
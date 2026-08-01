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
        da = rioxarray.open_rasterio(item.assets[asset_key].href)
        bbox_native = get_bbox_in_raster_crs(da, bbox)
        da = da.rio.clip_box(*bbox_native)
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
    bbox: List[float] = DEFAULT_BBOX, 
    grid_shape: Tuple[int, int] = DEFAULT_GRID
) -> np.ndarray:
    """
    Iterates over all signed STAC items, processes them, and builds 
    the 3D numpy array stack (Time, H, W) for the model.
    """
    logger.info(f"Processing {len(signed_items)} scenes into a {grid_shape} grid...")
    
    scanned = [load_and_regrid_item(it, bbox, grid_shape) for it in signed_items]
    
    # Filter out None values from failed reads
    valid_arrays = [arr for arr in scanned if arr is not None]
    
    if not valid_arrays:
        raise ValueError("All scenes failed to process. Check your STAC items or bounding box.")
        
    lst_stack = np.stack(valid_arrays)
    logger.info(f"Successfully built CLEAN LST Stack shape: {lst_stack.shape}")
    
    return lst_stack

def generate_ndvi_grid(
    s2_item: Any, 
    grid_shape: Tuple[int, int] = DEFAULT_GRID
) -> np.ndarray:
    """
    Downloads Red and NIR bands from Sentinel-2, regrids them, and calculates NDVI.
    """
    logger.info("Regridding Sentinel-2 bands to calculate true NDVI...")
    try:
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
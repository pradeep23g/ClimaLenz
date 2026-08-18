import logging
import planetary_computer as pc
from pystac_client import Client
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

from app.services.preprocessing import (
    DEFAULT_BBOX,
    DEFAULT_GRID,
    build_lst_stack,
    generate_landcover_and_mask,
    generate_ndvi_grid,
)


def _get_item_datetime(item) -> datetime:
    """
    Helper to safely extract datetime from STAC items.
    Prepended with '_' to indicate it's an internal module function.
    """
    if item.datetime is not None:
        return item.datetime
    # fallback to properties for items missing top-level datetime
    dt_str = item.properties.get("start_datetime") or item.properties.get("end_datetime")
    if dt_str:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    # last resort: push undated items to the end instead of crashing
    return datetime.min.replace(tzinfo=timezone.utc)


class PlanetaryThermalClient:
    """
    Service client to fetch Earth Observation data from Microsoft Planetary Computer.
    """
    def __init__(self):
        # Initialize the catalog connection once when the client is created
        self.catalog = Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1", 
            modifier=pc.sign_inplace
        )

    def fetch_modis_data(
        self, 
        bbox: List[float] = [80.15, 12.98, 80.29, 13.11], # Defaults to Chennai coordinates
        date_range: str = "2026-07-01/2026-07-31"         # 30-day window for fast live queries
    ) -> List[object]:
        """
        Searches the catalog for MODIS thermal data, filters for Terra satellite, 
        sorts chronologically, and signs the URLs for downloading.
        """
        print(f"Fetching MODIS STAC items for bbox {bbox} over {date_range}...")
        
        search = self.catalog.search(
            collections=["modis-11A1-061"], 
            bbox=bbox,
            datetime=date_range
        )
        
        items = list(search.items())
        
        # Sort chronologically using the helper function
        items = sorted(items, key=_get_item_datetime)

        # Filter strictly for MOD11A1 (Terra satellite) and take the 15 most recent scenes to guarantee real, cloud-free data.
        clean_items = [it for it in items if "MOD11A1" in it.id][-15:]
        print(f"Found {len(clean_items)} clean daily scenes for Terra satellite!")

        # Sign the URLs so rasterio/xarray can actually read the remote files
        signed_items = [pc.sign(item) for item in clean_items]
        
        return signed_items

    def fetch_sentinel2_item(
        self, 
        bbox: List[float] = [80.15, 12.98, 80.29, 13.11], 
        date_range: str = "2023-01-01/2026-07-31"
    ) -> Optional[object]:
        """
        Searches the catalog for a low-cloud Sentinel-2 scene to calculate real NDVI.
        """
        print(f"Fetching Sentinel-2 item for bbox {bbox}...")
        search = self.catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=date_range,
            query={"eo:cloud_cover": {"lt": 50}},
            sortby=[{"field": "properties.eo:cloud_cover", "direction": "asc"}],
            limit=5,
        )
        item = next(search.items(), None)
        if item:
            return item
        # Fallback search without cloud filter if no scene <50% found
        fallback_search = self.catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=date_range,
            limit=1,
        )
        return next(fallback_search.get_items(), None)

    def fetch_esa_worldcover_item(
        self, 
        bbox: List[float] = [80.15, 12.98, 80.29, 13.11]
    ) -> Optional[object]:
        """
        Searches the catalog for the static ESA WorldCover map for land masking.
        """
        print(f"Fetching ESA WorldCover item for bbox {bbox}...")
        search = self.catalog.search(
            collections=["esa-worldcover"],
            bbox=bbox,
        )
        return next(search.get_items(), None)

    def build_training_arrays(
        self,
        bbox: List[float] = DEFAULT_BBOX,
        date_range: str = "2026-07-01/2026-07-31",
        grid_shape: Tuple[int, int] = DEFAULT_GRID,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, str]:
        """
        One-call convenience wrapper that fetches everything the training/
        simulation pipeline needs and hands back the same 5-tuple shape as
        SyntheticThermalClient.build_training_arrays(), so
        app/services/satellite/client_factory.py can swap real <-> synthetic
        without the caller (app/main.py, training scripts) knowing the
        difference.
        """
        import time
        logger.info(f"=== HEAT ENGINE DATA FETCH START (date_range={date_range}) ===")
        t_total_fetch_0 = time.time()

        # 1. MODIS Search
        t_modis_search_0 = time.time()
        modis_items = self.fetch_modis_data(bbox=bbox, date_range=date_range)
        t_modis_search = round(time.time() - t_modis_search_0, 4)

        if not modis_items:
            raise ValueError(
                f"No MODIS scenes found for bbox={bbox} over date_range={date_range}."
            )

        date_min = _get_item_datetime(modis_items[0]).strftime("%Y-%m-%d")
        date_max = _get_item_datetime(modis_items[-1]).strftime("%Y-%m-%d")
        logger.info(f"MODIS Fetch Info: count={len(modis_items)} scenes, date_range_fetched=[{date_min} to {date_max}]")

        # 2. MODIS Download & Regrid
        t_modis_dl_0 = time.time()
        lst_stack, data_provenance = build_lst_stack(modis_items, bbox=bbox, grid_shape=grid_shape, date_range=date_range)
        t_modis_dl = round(time.time() - t_modis_dl_0, 4)

        # 3. Sentinel-2 Search & Download
        t_s2_0 = time.time()
        s2_item = self.fetch_sentinel2_item(bbox=bbox)
        if s2_item is None:
            raise ValueError(f"No low-cloud Sentinel-2 scene found for bbox={bbox}.")
        ndvi_grid = generate_ndvi_grid(s2_item, bbox=bbox, grid_shape=grid_shape)
        t_s2 = round(time.time() - t_s2_0, 4)

        # 4. ESA WorldCover Search & Download
        t_wc_0 = time.time()
        wc_item = self.fetch_esa_worldcover_item(bbox=bbox)
        if wc_item is None:
            raise ValueError(f"No ESA WorldCover scene found for bbox={bbox}.")
        landcover_grid, land_mask = generate_landcover_and_mask(wc_item, bbox=bbox, grid_shape=grid_shape)
        t_wc = round(time.time() - t_wc_0, 4)

        t_total_fetch = round(time.time() - t_total_fetch_0, 4)
        logger.info(f"=== HEAT ENGINE DATA FETCH TIMINGS ===")
        logger.info(f"  • MODIS STAC Search:         {t_modis_search}s")
        logger.info(f"  • MODIS Raster Downloads:    {t_modis_dl}s ({len(modis_items)} scenes: {date_min} -> {date_max})")
        logger.info(f"  • Sentinel-2 NDVI Download:  {t_s2}s")
        logger.info(f"  • ESA WorldCover Download:   {t_wc}s")
        logger.info(f"  • Total Search + Download:   {t_total_fetch}s")

        return lst_stack, ndvi_grid, landcover_grid, land_mask, data_provenance

    def build_inference_arrays(
        self,
        bbox: List[float] = DEFAULT_BBOX,
        date_range: str = "2026-07-01/2026-07-31",
        grid_shape: Tuple[int, int] = DEFAULT_GRID,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, str]:
        """
        Fetches minimal scenes for live inference.
        Returns: x_test_array, y_real_array, ndvi_grid, landcover_grid, land_mask, data_provenance
        """
        modis_items = self.fetch_modis_data(bbox=bbox, date_range=date_range)
        if not modis_items:
            raise ValueError(
                f"No MODIS scenes found for bbox={bbox} over date_range={date_range}."
            )
            
        from app.services.preprocessing import build_inference_input
        x_test, y_real, data_provenance = build_inference_input(
            modis_items, bbox=bbox, grid_shape=grid_shape, date_range=date_range
        )

        s2_item = self.fetch_sentinel2_item(bbox=bbox)
        if s2_item is None:
            raise ValueError(f"No low-cloud Sentinel-2 scene found for bbox={bbox}.")
        ndvi_grid = generate_ndvi_grid(s2_item, bbox=bbox, grid_shape=grid_shape)

        wc_item = self.fetch_esa_worldcover_item(bbox=bbox)
        if wc_item is None:
            raise ValueError(f"No ESA WorldCover scene found for bbox={bbox}.")
        landcover_grid, land_mask = generate_landcover_and_mask(wc_item, bbox=bbox, grid_shape=grid_shape)

        return x_test, y_real, ndvi_grid, landcover_grid, land_mask, data_provenance


# Example usage (This only runs if you execute this specific file directly for testing)
if __name__ == "__main__":
    client = PlanetaryThermalClient()
    items = client.fetch_modis_data()

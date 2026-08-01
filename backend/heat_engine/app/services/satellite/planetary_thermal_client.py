import planetary_computer as pc
from pystac_client import Client
from datetime import datetime, timezone
from typing import List, Optional

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
        date_range: str = "2025-01-01/2026-07-31"         # Expanded date range for better training
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

        # Filter strictly for MOD11A1 (Terra satellite)
        clean_items = [it for it in items if "MOD11A1" in it.id]
        print(f"Found {len(clean_items)} clean daily scenes for Terra satellite!")

        # Sign the URLs so rasterio/xarray can actually read the remote files
        signed_items = [pc.sign(item) for item in clean_items]
        
        return signed_items

def fetch_sentinel2_item(
        self, 
        bbox: List[float] = [80.15, 12.98, 80.29, 13.11], 
        date_range: str = "2023-01-01/2023-12-31"
    ) -> Optional[object]:
        """
        Searches the catalog for a low-cloud Sentinel-2 scene to calculate real NDVI.
        """
        print(f"Fetching Sentinel-2 item for bbox {bbox}...")
        search = self.catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=date_range,
            query={"eo:cloud_cover": {"lt": 5}}
        )
        # Return the first clean item found
        return next(search.get_items(), None)

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

# Example usage (This only runs if you execute this specific file directly for testing)
if __name__ == "__main__":
    client = PlanetaryThermalClient()
    items = client.fetch_modis_data()

    
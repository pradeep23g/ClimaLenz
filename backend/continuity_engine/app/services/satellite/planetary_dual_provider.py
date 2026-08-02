"""Real Sentinel-2 (optical) + Sentinel-1 (SAR) retrieval via Planetary Computer.

Same free, no-API-key source used everywhere else in this project. Finds
the cloudiest-but-still-usable recent Sentinel-2 scene (Layer 0 exists
specifically to repair cloudy scenes — searching for a LOW-cloud scene
here would defeat the purpose), then finds the closest-in-time Sentinel-1
scene over the same AOI to use as the structural repair signal.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

import numpy as np
import planetary_computer
import rasterio
from pystac_client import Client
from rasterio.mask import mask as rio_mask
from rasterio.warp import transform_geom

from app.services.satellite.base import (
    ContinuityDataError,
    DualSourceBundle,
    NoUsableSceneError,
)

OPTICAL_BAND_KEYS = ["B02", "B03", "B04", "B05", "B08", "B11"]  # blue,green,red,red_edge,nir,swir
REFLECTANCE_SCALE = 10_000.0
SAR_BAND_KEYS = ["vv", "vh"]

# Layer 0 wants a scene WITH clouds to repair — but not >90% cloud, since
# there'd be nothing left to anchor reconstruction to. This range is the
# opposite of water_engine/heat_engine's low-cloud search on purpose.
MIN_CLOUD_TO_REPAIR = 15.0
MAX_CLOUD_TO_REPAIR = 90.0


class PlanetaryDualProvider:
    name = "microsoft-planetary-computer-dual"

    def __init__(self, stac_url: str = "https://planetarycomputer.microsoft.com/api/stac/v1") -> None:
        self._stac_url = stac_url
        self._client: Client | None = None

    def _client_lazy(self) -> Client:
        if self._client is None:
            self._client = Client.open(self._stac_url)
        return self._client

    def fetch(
        self,
        *,
        geometry: dict[str, Any],
        start_date: date,
        end_date: date,
    ) -> DualSourceBundle:
        client = self._client_lazy()

        optical_item = self._find_cloudy_optical_scene(client, geometry, start_date, end_date)
        sar_item = self._find_nearest_sar_scene(client, geometry, optical_item)

        optical_signed = planetary_computer.sign(optical_item)
        sar_signed = planetary_computer.sign(sar_item)

        optical_stack, cloud_mask, cloud_pct = self._read_optical(optical_signed, geometry)
        sar_stack = self._read_sar(sar_signed, geometry, target_shape=optical_stack.shape[1:])

        capture_dt = optical_signed.datetime or datetime.fromisoformat(
            optical_signed.properties["datetime"].replace("Z", "+00:00")
        )

        return DualSourceBundle(
            optical_bands=optical_stack,
            sar_bands=sar_stack,
            cloud_mask=cloud_mask,
            optical_scene_id=optical_signed.id,
            sar_scene_id=sar_signed.id,
            capture_date=capture_dt,
            cloud_cover_pct=cloud_pct,
            provider=self.name,
            metadata={
                "sar_datetime": (sar_signed.datetime or "").__str__(),
                "days_between_scenes": abs(
                    ((optical_signed.datetime or capture_dt) - (sar_signed.datetime or capture_dt)).days
                ),
            },
        )

    def _find_cloudy_optical_scene(self, client, geometry, start_date, end_date):
        search = client.search(
            collections=["sentinel-2-l2a"],
            intersects=geometry,
            datetime=f"{start_date.isoformat()}/{end_date.isoformat()}",
            query={
                "eo:cloud_cover": {"gte": MIN_CLOUD_TO_REPAIR, "lte": MAX_CLOUD_TO_REPAIR}
            },
            sortby=[{"field": "properties.datetime", "direction": "desc"}],
            limit=5,
        )
        items = list(search.items())
        if not items:
            raise NoUsableSceneError(
                f"No Sentinel-2 scene with {MIN_CLOUD_TO_REPAIR}-{MAX_CLOUD_TO_REPAIR}% "
                f"cloud cover found for this AOI/date range."
            )
        return items[0]

    def _find_nearest_sar_scene(self, client, geometry, optical_item):
        target_dt = optical_item.datetime
        window_start = (target_dt - timedelta(days=6)).date().isoformat()
        window_end = (target_dt + timedelta(days=6)).date().isoformat()

        search = client.search(
            collections=["sentinel-1-rtc"],
            intersects=geometry,
            datetime=f"{window_start}/{window_end}",
            limit=10,
        )
        items = list(search.items())
        if not items:
            raise NoUsableSceneError(
                "No Sentinel-1 SAR scene found within +/-6 days of the optical scene."
            )
        # Closest in time to the optical scene.
        return min(items, key=lambda it: abs((it.datetime - target_dt).total_seconds()))

    def _read_optical(self, item, geometry) -> tuple[np.ndarray, np.ndarray, float]:
        bands = []
        for key in OPTICAL_BAND_KEYS:
            href = item.assets[key].href
            with rasterio.open(href) as src:
                geom_native = transform_geom("EPSG:4326", src.crs, geometry)
                clipped, _ = rio_mask(src, [geom_native], crop=True, indexes=1, filled=False)
                data = np.asarray(clipped, dtype=np.float32) / REFLECTANCE_SCALE
                mask = np.ma.getmaskarray(clipped) if np.ma.isMaskedArray(clipped) else np.zeros_like(data, dtype=bool)
                bands.append(np.where(mask, np.nan, data))

        target_shape = bands[0].shape
        stack = np.stack(
            [b if b.shape == target_shape else _resize_nearest(b, target_shape) for b in bands]
        )

        scl_mask = self._read_scl_cloud_mask(item, geometry, target_shape)
        cloud_pct = float(scl_mask.mean() * 100.0)
        stack[:, scl_mask] = np.nan
        return stack, scl_mask, cloud_pct

    def _read_scl_cloud_mask(self, item, geometry, target_shape) -> np.ndarray:
        """Sentinel-2's Scene Classification Layer — cloud/shadow/cirrus classes."""
        try:
            href = item.assets["SCL"].href
            with rasterio.open(href) as src:
                geom_native = transform_geom("EPSG:4326", src.crs, geometry)
                clipped, _ = rio_mask(src, [geom_native], crop=True, indexes=1, filled=False)
                scl = np.asarray(clipped)
                cloud_classes = {3, 8, 9, 10}  # shadow, medium/high-prob cloud, cirrus
                mask = np.isin(scl, list(cloud_classes))
                if mask.shape != target_shape:
                    mask = _resize_nearest(mask, target_shape)
                return mask
        except Exception as exc:
            raise ContinuityDataError(f"failed to read SCL cloud mask: {exc}") from exc

    def _read_sar(self, item, geometry, target_shape) -> np.ndarray:
        bands = []
        for key in SAR_BAND_KEYS:
            href = item.assets[key].href
            with rasterio.open(href) as src:
                geom_native = transform_geom("EPSG:4326", src.crs, geometry)
                clipped, _ = rio_mask(src, [geom_native], crop=True, indexes=1, filled=False)
                data = np.asarray(clipped, dtype=np.float32)
                data_db = 10.0 * np.log10(np.clip(data, 1e-6, None))
                if data_db.shape != target_shape:
                    data_db = _resize_nearest(data_db, target_shape)
                bands.append(data_db)
        return np.stack(bands)


def _resize_nearest(arr: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    rows, cols = shape
    src_rows, src_cols = arr.shape
    row_idx = np.linspace(0, src_rows - 1, rows).astype(int)
    col_idx = np.linspace(0, src_cols - 1, cols).astype(int)
    return arr[np.ix_(row_idx, col_idx)]

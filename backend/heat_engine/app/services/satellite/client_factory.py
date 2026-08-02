from __future__ import annotations

import logging
import os

from app.services.satellite.base import ThermalDataClient

logger = logging.getLogger(__name__)


class ThermalGatewayFactory:
    """
    Factory pattern for instantiating the appropriate thermal-data client.
    Mirrors water_engine's SatelliteGatewayFactory so both engines are
    controlled by the same offline-mode switch and the same lazy-import
    discipline (heavy geospatial libraries like rioxarray/pystac only get
    imported when the live client is actually selected).
    """

    @classmethod
    def initialize_client(cls) -> ThermalDataClient:
        """
        Resolves and loads the active thermal data gateway.

        Offline/Demo mode is controlled via CLIMALENZ_LOCAL_MOCK_API=1
        (same env var water_engine already uses -- one switch flips both
        engines into offline mode together).
        """
        use_mock_api = os.getenv("CLIMALENZ_LOCAL_MOCK_API", "0") == "1"

        if use_mock_api:
            logger.warning("Initializing Synthetic Thermal Client (CLIMALENZ_LOCAL_MOCK_API=1). Network bypassed.")
            from app.services.satellite.synthetic_thermal_client import SyntheticThermalClient
            return SyntheticThermalClient()

        logger.info("Initializing Live Planetary Computer Thermal Client Gateway.")
        from app.services.satellite.planetary_thermal_client import PlanetaryThermalClient
        return PlanetaryThermalClient()


# Exported singleton-style accessor for pipeline integration
resolve_thermal_client = ThermalGatewayFactory.initialize_client

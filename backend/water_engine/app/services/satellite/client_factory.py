from __future__ import annotations

import logging
import os

from app.services.satellite.provider_contracts import EarthObservationClient

logger = logging.getLogger(__name__)


class SatelliteGatewayFactory:
    """
    Factory pattern for instantiating the appropriate satellite retrieval client.
    Supports dependency injection and offline-mode short-circuiting for robust demos.
    """

    @classmethod
    def initialize_client(cls) -> EarthObservationClient:
        """
        Resolves and loads the active Earth Observation gateway.

        Offline/Demo mode is controlled via CLIMALENZ_LOCAL_MOCK_API=1.
        Lazy imports are utilized strictly to prevent heavy geospatial library
        (rasterio, pystac) initialization during cold-start or offline-demo environments.
        """
        use_mock_api = os.getenv("CLIMALENZ_LOCAL_MOCK_API", "0") == "1"

        if use_mock_api:
            logger.warning("Initializing Synthetic Satellite Client (CLIMALENZ_LOCAL_MOCK_API=1). Network bypassed.")
            from app.services.satellite.synthetic_client import SyntheticObservationClient
            return SyntheticObservationClient()

        logger.info("Initializing Live Planetary Computer Client Gateway.")
        from app.services.satellite.planetary_client import PlanetaryComputerGateway
        return PlanetaryComputerGateway()


# Exported singleton-style accessor for pipeline integration
resolve_satellite_client = SatelliteGatewayFactory.initialize_client
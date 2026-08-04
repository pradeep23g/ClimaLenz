from __future__ import annotations

import os

from app.services.satellite.base import DualSourceProvider


def get_dual_source_provider() -> DualSourceProvider:
    """CLIMALENZ_LOCAL_MOCK_API=1 forces offline mode — same env var
    already used by water_engine, so one flag controls demo mode across
    every layer consistently."""
    if os.getenv("CLIMALENZ_LOCAL_MOCK_API", "0") == "1":
        from app.services.satellite.synthetic_provider import SyntheticDualProvider

        return SyntheticDualProvider()

    from app.services.satellite.planetary_dual_provider import PlanetaryDualProvider

    return PlanetaryDualProvider()

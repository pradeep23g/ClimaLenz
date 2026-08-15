import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

import logging
logging.basicConfig(level=logging.INFO)

from app.services.satellite.planetary_thermal_client import PlanetaryThermalClient

if __name__ == "__main__":
    client = PlanetaryThermalClient()
    t0 = time.time()
    try:
        lst, ndvi, lc, mask = client.build_training_arrays()
        print(f"LST Shape: {lst.shape}")
    except Exception as e:
        print(f"Error: {e}")
    t_total = time.time() - t0
    print(f"Total time: {t_total:.4f}s")

import httpx
import time
import subprocess
import os
import sys

def test_bridge_request(cloud_tolerance_pct=100):
    payload = {
        "spatial_geometry": {
            "type": "Polygon",
            "coordinates": [[[72.8, 19.0], [72.81, 19.0], [72.81, 19.01], [72.8, 19.01], [72.8, 19.0]]]
        },
        "lookback_days": 30,
        "cloud_tolerance_pct": cloud_tolerance_pct
    }
    resp = httpx.post('http://localhost:8000/v1/colocation/assess', json=payload, timeout=120)
    return resp

print("--- RUNNING TASK 7 RESILIENCE TESTS ---")
try:
    print("Test 1: Golden Baseline")
    resp = test_bridge_request()
    resp.raise_for_status()
    data = resp.json()
    assert data["execution_mode"] == "LIVE"
    assert "water_score" in data
    print("Golden Baseline PASS")
except Exception as e:
    print(f"Golden Baseline FAIL: {e}")

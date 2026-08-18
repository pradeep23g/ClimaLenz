import sys
import time
import requests
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

payload = {
    "spatial_geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [80.15, 12.98],
                [80.29, 12.98],
                [80.29, 13.11],
                [80.15, 13.11],
                [80.15, 12.98],
            ]
        ],
    },
    "intervention_type": "CANOPY",
    "delta": 0.15,
    "lookback_days": 30,
    "cloud_tolerance_pct": 30.0,
}

print("===========================================================================")
print("🌐 Triggering Live End-to-End ClimaLenz Assessment (POST http://localhost:8000/v1/colocation/assess)")
print("===========================================================================")

t_start = time.time()
resp = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload, timeout=600)
t_end = time.time()

total_time = t_end - t_start

print(f"Status Code: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print("✅ CoLocationReport Received Successfully!")
    print(f"  Triggered: {data.get('triggered')}")
    print(f"  Water Risk Score: {data.get('water_score')}")
    print(f"  Water Tier: {data.get('water_tier')}")
    print(f"  Water Confidence Band: {data.get('water_confidence_band')}")
    print(f"  Water Scene Cloud Cover: {data.get('water_scene_cloud_cover')}%")
    print(f"  Water Scene Provider: {data.get('water_scene_provider')}")
    print(f"  Heat Guardrail Status: {data.get('heat_guardrail_status')}")
    print(f"  Heat Delta Summary: {data.get('heat_delta_summary')}")
    print(f"  Provenance: {data.get('provenance')}")
    print(f"  Execution Mode: {data.get('execution_mode')}")
    print(f"  Data Status: {data.get('data_status')}")
    print(f"  Stage Timings: {data.get('stage_timings')}")
    print(f"  Total Execution Time: {total_time:.2f}s")
    print(f"  Caveats / Provenance Warnings ({len(data.get('caveats', []))}):")
    for idx, c in enumerate(data.get('caveats', []), 1):
        print(f"    {idx}. {c}")
else:
    print(f"❌ Failed with status {resp.status_code}: {resp.text}")

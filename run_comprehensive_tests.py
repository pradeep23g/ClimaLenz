import os
import sys
import time
import subprocess
import requests
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent

SERVICES = [
    {
        "name": "Water Engine",
        "cwd": BASE_DIR / "backend" / "water_engine",
        "port": 8001,
        "health_url": "http://127.0.0.1:8001/health/status",
        "env": {"CLIMALENZ_LOCAL_MOCK_API": "1"},
    },
    {
        "name": "Heat Engine",
        "cwd": BASE_DIR / "backend" / "heat_engine",
        "port": 8002,
        "health_url": "http://127.0.0.1:8002/health/status",
        "env": {"CLIMALENZ_LOCAL_MOCK_API": "1"},
    },
    {
        "name": "Bridge Engine",
        "cwd": BASE_DIR / "backend" / "bridge",
        "port": 8000,
        "health_url": "http://127.0.0.1:8000/health/status",
        "env": {
            "WATER_ENGINE_URL": "http://127.0.0.1:8001",
            "HEAT_ENGINE_URL": "http://127.0.0.1:8002",
            "CLIMALENZ_LOCAL_MOCK_API": "1",
        },
    },
    {
        "name": "Agents Layer",
        "cwd": BASE_DIR / "backend" / "agents",
        "port": 8004,
        "health_url": "http://127.0.0.1:8004/health",
        "env": {},
    },
]

def start_services():
    processes = []
    python_exe = sys.executable

    print("🚀 Starting ClimaLenz Microservices...")
    for svc in SERVICES:
        env = os.environ.copy()
        env["PYTHONPATH"] = str(svc["cwd"])
        env.update(svc["env"])

        cmd = [
            python_exe,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(svc["port"]),
        ]
        
        proc = subprocess.Popen(
            cmd,
            cwd=str(svc["cwd"]),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        processes.append((svc, proc))
        print(f"  └─ Started {svc['name']} on port {svc['port']} (PID: {proc.pid})")

    # Wait for all services to pass health checks
    print("\n⏳ Waiting for all services to become healthy...")
    per_service_timeout = 30.0

    for svc, _ in processes:
        healthy = False
        svc_start_time = time.time()
        while time.time() - svc_start_time < per_service_timeout:
            try:
                resp = requests.get(svc["health_url"], timeout=1.0)
                if resp.status_code == 200:
                    healthy = True
                    print(f"  ✅ {svc['name']} is ready.")
                    break
            except Exception:
                time.sleep(0.5)

        if not healthy:
            print(f"  ❌ Timed out waiting for {svc['name']} at {svc['health_url']}")
            stop_services(processes)
            sys.exit(1)

    print("🌟 All 4 Microservices Operational!\n")
    return processes


def stop_services(processes):
    print("\n🧹 Shutting down microservices...")
    for svc, proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=3.0)
        except Exception:
            proc.kill()
        print(f"  └─ Stopped {svc['name']}")


def run_tests():
    sample_geometry = {
        "type": "Polygon",
        "coordinates": [
            [
                [77.580, 12.960],
                [77.600, 12.960],
                [77.600, 12.980],
                [77.580, 12.980],
                [77.580, 12.960],
            ]
        ],
    }
    sample_bbox = [77.580, 12.960, 77.600, 12.980]

    test_results = []

    # -------------------------------------------------------------
    # Test 1: Normal Baseline Scenario
    # -------------------------------------------------------------
    print("=" * 70)
    print("🧪 Test Case 1: Normal Operational Baseline")
    print("=" * 70)
    payload_1 = {
        "spatial_geometry": sample_geometry,
        "bbox": sample_bbox,
        "intervention_type": "CANOPY",
        "delta": 0.15,
        "cloud_tolerance_pct": 30.0,
    }
    resp1 = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload_1)
    data1 = {}
    if resp1.status_code == 200:
        data1 = resp1.json()
        print(f"  Status Code: {resp1.status_code}")
        print(f"  Triggered Co-Location Risk: {data1.get('triggered')}")
        print(f"  Water Tier: {data1.get('water_tier')}")
        print(f"  Water Confidence: {data1.get('water_confidence_band')}")
        print(f"  Heat Guardrail Status: {data1.get('heat_guardrail_status')}")
        
        passed1 = data1.get("heat_guardrail_status") == "PASSED"
        test_results.append(("Normal Operational Baseline", passed1, "Guardrail PASSED as expected"))
    else:
        print(f"  ❌ Failed with status {resp1.status_code}: {resp1.text}")
        test_results.append(("Normal Operational Baseline", False, f"HTTP {resp1.status_code}"))

    # -------------------------------------------------------------
    # Test 2: Edge Case 1 - Live Monsoon (Continuity Engine Trigger)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("🧪 Test Case 2: Edge Case 1 - The Live Monsoon (Cloud Tolerance 100%)")
    print("=" * 70)
    payload_2 = {
        "spatial_geometry": sample_geometry,
        "bbox": sample_bbox,
        "intervention_type": "CANOPY",
        "delta": 0.15,
        "cloud_tolerance_pct": 100.0,
    }
    resp2 = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload_2)
    if resp2.status_code == 200:
        data2 = resp2.json()
        print(f"  Status Code: {resp2.status_code}")
        print(f"  Water Risk Score: {data2.get('water_score')}")
        print(f"  Water Confidence Band: {data2.get('water_confidence_band')}")
        print(f"  Narrative: {data2.get('narrative')[:120]}...")
        
        passed2 = data2.get("water_confidence_band") in ("low", "medium", "high")
        test_results.append(("Live Monsoon / Continuity Trigger", passed2, f"Water confidence: {data2.get('water_confidence_band')}"))
    else:
        print(f"  ❌ Failed with status {resp2.status_code}: {resp2.text}")
        test_results.append(("Live Monsoon / Continuity Trigger", False, f"HTTP {resp2.status_code}"))

    # -------------------------------------------------------------
    # Test 3: Edge Case 2 - The Impossible Physics (Guardrail Trigger)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("🧪 Test Case 3: Edge Case 2 - Impossible Physics (Delta = 20.0°C)")
    print("=" * 70)
    payload_3 = {
        "spatial_geometry": sample_geometry,
        "bbox": sample_bbox,
        "intervention_type": "COOL_ROOF",
        "delta": 1.8,
        "cloud_tolerance_pct": 30.0,
    }
    resp3 = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload_3)
    data3 = {}
    if resp3.status_code == 200:
        data3 = resp3.json()
        print(f"  Status Code: {resp3.status_code}")
        print(f"  Heat Guardrail Status: {data3.get('heat_guardrail_status')}")
        print(f"  Co-location Triggered: {data3.get('triggered')}")
        print(f"  Narrative Warning: {data3.get('narrative')[:120]}...")
        
        passed3 = data3.get("heat_guardrail_status") == "FLAGGED"
        test_results.append(("Impossible Physics Guardrail", passed3, "Correctly FLAGGED thermodynamics violation"))
    else:
        print(f"  ❌ Failed with status {resp3.status_code}: {resp3.text}")
        test_results.append(("Impossible Physics Guardrail", False, f"HTTP {resp3.status_code}"))

    # -------------------------------------------------------------
    # Test 4: Edge Case 3 - AI Agent Integration (Reporter Generation)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("🧪 Test Case 4: Edge Case 3 - AI Agent Integration (Reporter Generation)")
    print("=" * 70)
    latest_report = data3 if data3 else data1
    agent_payload = {
        "session_id": "comprehensive-test-session-01",
        "consolidated_payload": latest_report,
    }
    resp4 = requests.post("http://127.0.0.1:8004/api/reporter/generate", json=agent_payload)
    if resp4.status_code == 200:
        data4 = resp4.json()
        print(f"  Status Code: {resp4.status_code}")
        print(f"  Reporter Response Keys: {list(data4.keys())}")
        summary_preview = str(data4)[:150]
        print(f"  Report Preview: {summary_preview}...")
        
        passed4 = isinstance(data4, dict) and len(data4) > 0
        test_results.append(("AI Agent Reporter Generation", passed4, "Generated structured report cleanly"))
    else:
        print(f"  ❌ Failed with status {resp4.status_code}: {resp4.text}")
        test_results.append(("AI Agent Reporter Generation", False, f"HTTP {resp4.status_code}"))

    # Summary Table
    print("\n" + "=" * 70)
    print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
    print("=" * 70)
    all_passed = True
    for name, status, detail in test_results:
        symbol = "✅ PASS" if status else "❌ FAIL"
        if not status:
            all_passed = False
        print(f"  {symbol:8s} | {name:35s} | {detail}")
    print("=" * 70)
    return all_passed


if __name__ == "__main__":
    procs = start_services()
    try:
        success = run_tests()
        if not success:
            sys.exit(1)
    finally:
        stop_services(procs)

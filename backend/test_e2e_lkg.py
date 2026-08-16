import os
import sys
import time
import subprocess
import requests
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent

def main():
    print("🚀 Starting ClimaLenz E2E LKG Recovery Test...")

    env = os.environ.copy()
    env["CLIMALENZ_LOCAL_MOCK_API"] = "0"

    services = [
        {
            "name": "Water Engine",
            "cwd": BASE_DIR / "water_engine",
            "port": 8001,
            "url": "http://127.0.0.1:8001/health/status",
        },
        {
            "name": "Heat Engine",
            "cwd": BASE_DIR / "heat_engine",
            "port": 8002,
            "url": "http://127.0.0.1:8002/health/status",
        },
        {
            "name": "Bridge Engine",
            "cwd": BASE_DIR / "bridge",
            "port": 8000,
            "url": "http://127.0.0.1:8000/health/status",
        },
    ]

    procs = []
    try:
        # 1. Start all services
        for svc in services:
            svc_env = env.copy()
            svc_env["PYTHONPATH"] = str(svc["cwd"])
            if svc["name"] == "Bridge Engine":
                svc_env["WATER_ENGINE_URL"] = "http://127.0.0.1:8001"
                svc_env["HEAT_ENGINE_URL"] = "http://127.0.0.1:8002"

            cmd = [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(svc["port"]),
            ]
            out_file = open(BASE_DIR / f"{svc['name'].replace(' ', '_')}.log", "w", encoding="utf-8")
            p = subprocess.Popen(
                cmd,
                cwd=str(svc["cwd"]),
                env=svc_env,
                stdout=out_file,
                stderr=subprocess.STDOUT,
            )
            svc["log_file"] = out_file
            procs.append((svc, p))
            print(f"  └─ Started {svc['name']} on port {svc['port']} (PID: {p.pid})")

        print("\n⏳ Waiting for microservices to pass health checks...")
        for svc, _ in procs:
            st = time.time()
            healthy = False
            while time.time() - st < 60.0:
                try:
                    if requests.get(svc["url"], timeout=1.0).status_code == 200:
                        healthy = True
                        print(f"  ✅ {svc['name']} is ready.")
                        break
                except Exception:
                    time.sleep(0.5)

            if not healthy:
                print(f"  ❌ Failed to reach {svc['name']} at {svc['url']}")
                sys.exit(1)

        # 2. Make Initial LIVE Request
        chennai_bbox = [80.22, 13.04, 80.23, 13.05]
        payload = {
            "spatial_geometry": {
                "type": "Polygon",
                "coordinates": [[[80.22, 13.04], [80.23, 13.04], [80.23, 13.05], [80.22, 13.05], [80.22, 13.04]]]
            },
            "bbox": chennai_bbox,
            "intervention_type": "CANOPY",
            "delta": 0.15,
            "cloud_tolerance_pct": 100.0,
        }

        print("\n📡 Phase 11: Making initial LIVE request to Bridge Engine (this should persist to Supabase)...")
        resp = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload, timeout=300.0)
        if resp.status_code != 200:
            print(f"Error from Bridge Engine: {resp.text}")
        resp.raise_for_status()
        bridge_report = resp.json()
        
        print(f"  ✅ Execution Mode: {bridge_report.get('execution_mode')}")
        print(f"  ✅ Data Status: {bridge_report.get('data_status')}")
        assert bridge_report.get('execution_mode') == 'LIVE', "First request should be LIVE"
        assert bridge_report.get('is_live') is True, "First request must be live"

        # 3. Terminate Water Engine to simulate failure
        print("\n💥 Phase 12: Simulating Water Engine failure by terminating its process...")
        for svc, p in procs:
            if svc["name"] == "Water Engine":
                p.terminate()
                p.wait()
                print("  ✅ Water Engine terminated.")

        # Give it a second to die
        time.sleep(1)

        # 4. Make Request Again - Should trigger LKG fallback
        print("\n📡 Making second request to Bridge Engine with Water Engine down...")
        resp2 = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload, timeout=300.0)
        resp2.raise_for_status()
        fallback_report = resp2.json()

        print(f"  ✅ Execution Mode: {fallback_report.get('execution_mode')}")
        print(f"  ✅ Data Status: {fallback_report.get('data_status')}")
        print(f"  ✅ Fallback Reason: {fallback_report.get('fallback_reason')}")
        
        assert fallback_report.get('execution_mode') == 'CACHED', "Second request must be CACHED"
        assert "LAST_KNOWN_GOOD" in fallback_report.get('data_status'), "Data status must indicate LKG"
        assert fallback_report.get('is_live') is False, "Fallback request must NOT be live"
        assert "Water Error" in fallback_report.get('fallback_reason'), "Fallback reason must cite water error"
        
        print("\n🎉 ALL TESTS PASSED! Supabase LKG caching and recovery works perfectly in E2E simulation.")

    finally:
        print("\n🧹 Shutting down remaining microservices...")
        for svc, p in procs:
            try:
                p.terminate()
                p.wait(timeout=1.0)
            except Exception:
                try:
                    p.kill()
                except:
                    pass

if __name__ == "__main__":
    main()

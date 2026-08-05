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
    print("🚀 Starting ClimaLenz Live Data Test (Chennai AOI)...")

    # 1. Force Live Mode globally for satellite & thermal providers
    env = os.environ.copy()
    env["CLIMALENZ_LOCAL_MOCK_API"] = "0"

    # 2. Configure 4 Microservices
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
        {
            "name": "Agents Layer",
            "cwd": BASE_DIR / "agents",
            "port": 8004,
            "url": "http://127.0.0.1:8004/health",
        },
    ]

    procs = []
    try:
        # Launch microservices with DEVNULL to prevent OS pipe deadlocks
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
            p = subprocess.Popen(
                cmd,
                cwd=str(svc["cwd"]),
                env=svc_env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            procs.append((svc, p))
            print(f"  └─ Started {svc['name']} on port {svc['port']} (PID: {p.pid})")

        # Health check wait loop
        print("\n⏳ Waiting for live microservices to pass health checks...")
        for svc, _ in procs:
            st = time.time()
            healthy = False
            while time.time() - st < 30.0:
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

        # 3. Define Real-World Payload for Chennai (1km x 1km block in Central Chennai)
        chennai_bbox = [80.22, 13.04, 80.23, 13.05]
        chennai_geojson = {
            "type": "Polygon",
            "coordinates": [
                [
                    [80.22, 13.04],
                    [80.23, 13.04],
                    [80.23, 13.05],
                    [80.22, 13.05],
                    [80.22, 13.04],
                ]
            ],
        }

        payload = {
            "spatial_geometry": chennai_geojson,
            "bbox": chennai_bbox,
            "intervention_type": "CANOPY",
            "delta": 0.15,
            "cloud_tolerance_pct": 100.0,  # Allow live satellite scene retrieval
        }

        # 4. Call Bridge Engine
        print(
            f"\n📡 Querying Microsoft Planetary Computer & PINN Heat Engine for Chennai bbox {chennai_bbox}..."
        )
        t0 = time.time()
        resp = requests.post(
            "http://127.0.0.1:8000/v1/colocation/assess",
            json=payload,
            timeout=300.0,
        )
        resp.raise_for_status()
        bridge_report = resp.json()
        print(f"  ✅ Live Bridge Assessment Completed in {time.time() - t0:.1f}s")
        print(
            f"     Water Score: {bridge_report.get('water_score')} ({bridge_report.get('water_tier')})"
        )
        print(
            f"     Water Confidence Band: {bridge_report.get('water_confidence_band')}"
        )
        print(f"     Heat Guardrail: {bridge_report.get('heat_guardrail_status')}")

        # 5. Forward to Agent Layer
        print("\n🤖 Forwarding physics data to Gemini LLM Reporter...")
        agent_req = {
            "session_id": "live-chennai-test-session",
            "consolidated_payload": bridge_report,
        }
        agent_resp = requests.post(
            "http://127.0.0.1:8004/api/reporter/generate",
            json=agent_req,
            timeout=60.0,
        )
        agent_resp.raise_for_status()
        reporter_output = agent_resp.json()

        # 6. Display AI Generated Executive Summary
        print("\n" + "=" * 70)
        print("=== AI GENERATED EXECUTIVE SUMMARY (CHENNAI AOI) ===")
        print("=" * 70)
        report_body = reporter_output.get("report", reporter_output)
        if isinstance(report_body, dict):
            print(f"Executive Summary:\n{report_body.get('executive_summary')}\n")
            print(f"Risk Level: {report_body.get('risk_level')}")
            print(f"Key Findings: {report_body.get('key_findings')}")
            print(
                f"Recommended Interventions: {report_body.get('recommended_interventions')}"
            )
            print(
                f"Limitations Disclaimer:\n{report_body.get('limitations_disclaimer')}"
            )
        else:
            print(report_body)
        print("=" * 70)

    finally:
        print("\n🧹 Shutting down microservices...")
        for svc, p in procs:
            try:
                p.terminate()
                p.wait(timeout=3.0)
            except Exception:
                p.kill()


if __name__ == "__main__":
    main()

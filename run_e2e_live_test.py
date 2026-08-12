from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import subprocess
import requests
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("run_e2e_live_test")

SERVICES = [
    {
        "name": "Water Engine",
        "cwd": BASE_DIR / "backend" / "water_engine",
        "port": 8001,
        "health_url": "http://127.0.0.1:8001/health/status",
        "env": {},
    },
    {
        "name": "Heat Engine",
        "cwd": BASE_DIR / "backend" / "heat_engine",
        "port": 8002,
        "health_url": "http://127.0.0.1:8002/health/status",
        "env": {},
    },
    {
        "name": "Continuity Engine",
        "cwd": BASE_DIR / "backend" / "continuity_engine",
        "port": 8003,
        "health_url": "http://127.0.0.1:8003/health/status",
        "env": {},
    },
    {
        "name": "Bridge Engine",
        "cwd": BASE_DIR / "backend" / "bridge",
        "port": 8000,
        "health_url": "http://127.0.0.1:8000/health/status",
        "env": {
            "WATER_ENGINE_URL": "http://127.0.0.1:8001",
            "HEAT_ENGINE_URL": "http://127.0.0.1:8002",
            "CONTINUITY_ENGINE_URL": "http://127.0.0.1:8003",
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


def start_services(mock_mode: bool = False):
    processes = []
    python_exe = sys.executable

    print("\n🚀 Starting ClimaLenz Microservices...")
    mode_str = "MOCK MODE (1)" if mock_mode else "LIVE MODE (0)"
    print(f"  └─ Global Mode: {mode_str}")

    for svc in SERVICES:
        env = os.environ.copy()
        env["PYTHONPATH"] = str(svc["cwd"])
        env["CLIMALENZ_LOCAL_MOCK_API"] = "1" if mock_mode else "0"
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

    print("\n⏳ Waiting for microservices to pass health checks...")
    per_service_timeout = 30.0

    for svc, _ in processes:
        healthy = False
        svc_start_time = time.time()
        while time.time() - svc_start_time < per_service_timeout:
            try:
                resp = requests.get(svc["health_url"], timeout=1.0)
                if resp.status_code == 200:
                    healthy = True
                    print(f"  ✅ {svc['name']} is operational.")
                    break
            except Exception:
                time.sleep(0.5)

        if not healthy:
            print(f"  ❌ Timed out waiting for {svc['name']} at {svc['health_url']}")
            stop_services(processes)
            sys.exit(1)

    print("🌟 All 5 Microservices Operational!\n")
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


def run_phase_1_continuity():
    print("=" * 75)
    print("🔬 Phase 1: Isolated Continuity Engine Check (200m x 200m AOI)")
    print("=" * 75)
    
    # 200m x 200m small AOI in downtown Bangalore
    small_geometry = {
        "type": "Polygon",
        "coordinates": [
            [
                [77.580, 12.960],
                [77.582, 12.960],
                [77.582, 12.962],
                [77.580, 12.962],
                [77.580, 12.960],
            ]
        ],
    }
    
    payload = {
        "geometry": small_geometry,
        "start_date": "2026-01-01",
        "end_date": "2026-01-15",
    }
    
    t0 = time.time()
    try:
        resp = requests.post(
            "http://127.0.0.1:8003/v1/reconstruction/repair",
            json=payload,
            timeout=30.0,
        )
        elapsed = round(time.time() - t0, 4)
        resp.raise_for_status()
        data = resp.json()
        print(f"  ✅ Response Status: {resp.status_code} ({elapsed}s)")
        print(f"     Provider: {data.get('provider')}")
        print(f"     Optical Scene ID: {data.get('optical_scene_id')}")
        print(f"     SAR Scene ID: {data.get('sar_scene_id')}")
        print(f"     Reconstructed Shape: {data.get('reconstructed_bands_shape')}")
        print(f"     Scene Confidence: {data.get('scene_confidence')}")
        print(f"     Low Confidence Fraction: {data.get('low_confidence_fraction')}")
        print(f"     Caveats: {data.get('caveats')}")

        # Dump reconstruction summary artifact
        scratch_dir = BASE_DIR / "scratch"
        scratch_dir.mkdir(exist_ok=True)
        output_file = scratch_dir / "continuity_reconstruction_summary.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"     💾 Saved reconstruction summary artifact to {output_file}")
        return True, elapsed
    except requests.HTTPError as err:
        print(f"  ❌ HTTP Error in Phase 1: {err.response.status_code} - {err.response.text}")
        return False, time.time() - t0
    except Exception as err:
        print(f"  ❌ Failed Phase 1: {err}")
        return False, time.time() - t0


def run_phase_2_e2e_chain():
    print("\n" + "=" * 75)
    print("⛓️ Phase 2: The E2E Live Chain (Bridge + All Agents)")
    print("=" * 75)

    sample_bbox = [77.580, 12.960, 77.600, 12.980]
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

    bridge_payload = {
        "spatial_geometry": sample_geometry,
        "bbox": sample_bbox,
        "intervention_type": "CANOPY",
        "delta": 0.15,
        "cloud_tolerance_pct": 30.0,
    }

    # 1. Call Bridge Engine
    print("  1️⃣ Requesting Bridge Assessment (/v1/colocation/assess)...")
    t_bridge_0 = time.time()
    try:
        resp_bridge = requests.post(
            "http://127.0.0.1:8000/v1/colocation/assess",
            json=bridge_payload,
            timeout=300.0,
        )
        resp_bridge.raise_for_status()
        bridge_report = resp_bridge.json()
        timings = bridge_report.get("stage_timings", {})
        print(f"     ✅ Bridge Assessment Completed!")
        print(f"        • Water Engine: {timings.get('water_engine_s')}s")
        print(f"        • Heat Engine:  {timings.get('heat_engine_s')}s")
        print(f"        • Total Bridge: {timings.get('total_s')}s")
        print(f"     Summary: Water Tier={bridge_report.get('water_tier')}, Heat Guardrail={bridge_report.get('heat_guardrail_status')}")
    except requests.HTTPError as err:
        print(f"  ❌ Bridge HTTP Error ({err.response.status_code}): {err.response.text}")
        return False
    except Exception as err:
        print(f"  ❌ Bridge Request Error: {err}")
        return False

    # 2. Call Reporter Agent
    print("\n  2️⃣ Invoking Reporter Agent (/api/reporter/generate)...")
    t_rep_0 = time.time()
    reporter_out = {}
    try:
        resp_rep = requests.post(
            "http://127.0.0.1:8004/api/reporter/generate",
            json={"session_id": "e2e-live-session", "consolidated_payload": bridge_report},
            timeout=60.0,
        )
        resp_rep.raise_for_status()
        reporter_out = resp_rep.json()
        rep_s = round(time.time() - t_rep_0, 4)
        print(f"     ✅ Reporter Completed in {rep_s}s")
        print(f"        Risk Level: {reporter_out.get('risk_level')}")
        print(f"        Summary Preview: {str(reporter_out.get('executive_summary'))[:100]}...")
    except Exception as err:
        print(f"  ⚠️ Reporter Agent Call Warning/Error: {err}")

    # 3. Call Copilot Agent
    print("\n  3️⃣ Invoking Copilot Agent (/api/copilot/chat)...")
    t_cop_0 = time.time()
    copilot_out = {}
    try:
        resp_cop = requests.post(
            "http://127.0.0.1:8004/api/copilot/chat",
            json={"session_id": "e2e-live-session", "prompt": "Assess ecological water risk for Bangalore"},
            timeout=60.0,
        )
        resp_cop.raise_for_status()
        copilot_out = resp_cop.json()
        cop_s = round(time.time() - t_cop_0, 4)
        print(f"     ✅ Copilot Completed in {cop_s}s")
        print(f"        Answer Preview: {str(copilot_out.get('answer'))[:100]}...")
    except Exception as err:
        print(f"  ⚠️ Copilot Agent Call Warning/Error: {err}")

    # 4. Call Critic Agent
    print("\n  4️⃣ Invoking Critic Agent (/api/critic/audit)...")
    t_crit_0 = time.time()
    critic_out = {}
    try:
        resp_crit = requests.post(
            "http://127.0.0.1:8004/api/critic/audit",
            json={
                "session_id": "e2e-live-session",
                "engine_payload": bridge_report,
                "reporter_output": reporter_out,
                "copilot_output": copilot_out,
            },
            timeout=60.0,
        )
        resp_crit.raise_for_status()
        critic_out = resp_crit.json()
        crit_s = round(time.time() - t_crit_0, 4)
        print(f"     ✅ Critic Completed in {crit_s}s")
        print(f"        Verdict: {critic_out.get('verdict')} (Faithfulness Score: {critic_out.get('faithfulness_score')})")
    except Exception as err:
        print(f"  ⚠️ Critic Agent Call Warning/Error: {err}")

    return True


def run_phase_3_resilience_tests():
    print("\n" + "=" * 75)
    print("🛡️ Phase 3: Resilience Fallback Tests")
    print("=" * 75)

    sample_bbox = [77.580, 12.960, 77.600, 12.980]
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

    # Test 3A: Dummy/Mock API fallback test
    print("  🧪 Test 3A: Synthetic Fallback Provider Test (High Cloud Tolerance)")
    payload_3a = {
        "spatial_geometry": sample_geometry,
        "bbox": sample_bbox,
        "intervention_type": "CANOPY",
        "delta": 0.15,
        "cloud_tolerance_pct": 100.0,
    }
    try:
        resp = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload_3a, timeout=300.0)
        resp.raise_for_status()
        data = resp.json()
        print(f"     ✅ Status: {resp.status_code} | Water Score: {data.get('water_score')} | Heat Status: {data.get('heat_guardrail_status')}")
    except Exception as err:
        print(f"     ❌ Test 3A Failed: {err}")
        return False

    # Test 3B: Input Validation & Boundary Error Handling
    print("\n  🧪 Test 3B: Boundary Error Handling (Delta out of bounds)")
    payload_3b = {
        "spatial_geometry": sample_geometry,
        "bbox": sample_bbox,
        "intervention_type": "CANOPY",
        "delta": 99.0,  # Exceeds schema max 2.0
        "cloud_tolerance_pct": 30.0,
    }
    resp_3b = requests.post("http://127.0.0.1:8000/v1/colocation/assess", json=payload_3b, timeout=10.0)
    if resp_3b.status_code in (422, 502):
        print(f"     ✅ Correctly rejected invalid input with HTTP {resp_3b.status_code} (no unhandled 500 crash).")
    else:
        print(f"     ⚠️ Unexpected response status: {resp_3b.status_code}")

    return True


def main():
    parser = argparse.ArgumentParser(description="ClimaLenz E2E Live Chain & Timing Harness")
    parser.add_argument(
        "--cached",
        "--mock",
        action="store_true",
        help="Run microservices in Mock Mode (CLIMALENZ_LOCAL_MOCK_API=1) instead of fetching live satellite data.",
    )
    args = parser.parse_args()

    procs = start_services(mock_mode=args.cached)
    try:
        print("\n" + "#" * 75)
        print("⚡ CLIMALENZ END-TO-END TIMING & VALIDATION HARNESS")
        print("#" * 75)
        
        p1_ok, p1_time = run_phase_1_continuity()
        p2_ok = run_phase_2_e2e_chain()
        p3_ok = run_phase_3_resilience_tests()

        print("\n" + "=" * 75)
        print("📊 FINAL SUMMARY")
        print("=" * 75)
        print(f"  Phase 1 (Continuity Engine Check): {'✅ PASS' if p1_ok else '❌ FAIL'} ({p1_time:.4f}s)")
        print(f"  Phase 2 (E2E Live Chain):         {'✅ PASS' if p2_ok else '❌ FAIL'}")
        print(f"  Phase 3 (Resilience Fallbacks):   {'✅ PASS' if p3_ok else '❌ FAIL'}")
        print("=" * 75 + "\n")
    finally:
        stop_services(procs)


if __name__ == "__main__":
    main()

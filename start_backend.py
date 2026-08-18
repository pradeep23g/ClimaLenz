#!/usr/bin/env python3
"""
ClimaLenz Backend Runner
Launches and monitors all 5 backend microservices:
 - Bridge Engine (Port 8000)
 - Water Engine (Port 8001)
 - Heat Engine (Port 8002)
 - Continuity Engine (Port 8003)
 - Agents Layer (Port 8004)

Usage:
    python start_backend.py
"""

import os
import sys
import time
import signal
import subprocess
import requests
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent

SERVICES = [
    {
        "name": "Bridge Engine",
        "cwd": BASE_DIR / "backend" / "bridge",
        "port": 8000,
        "health_url": "http://127.0.0.1:8000/health/status",
        "env": {
            "WATER_ENGINE_URL": "http://127.0.0.1:8001",
            "HEAT_ENGINE_URL": "http://127.0.0.1:8002",
            "CONTINUITY_ENGINE_URL": "http://127.0.0.1:8003",
            "AGENTS_URL": "http://127.0.0.1:8004",
        },
    },
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

    print("==========================================================================")
    print("🚀 Starting All 5 ClimaLenz Backend Microservices...")
    print("==========================================================================")

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
            "0.0.0.0",
            "--port",
            str(svc["port"]),
        ]

        proc = subprocess.Popen(
            cmd,
            cwd=str(svc["cwd"]),
            env=env,
        )
        processes.append((svc, proc))
        print(f"  └─ Started {svc['name']} on http://localhost:{svc['port']} (PID: {proc.pid})")

    print("\n⏳ Waiting for health checks...")
    per_service_timeout = 30.0

    for svc, _ in processes:
        healthy = False
        svc_start_time = time.time()
        while time.time() - svc_start_time < per_service_timeout:
            try:
                resp = requests.get(svc["health_url"], timeout=1.0)
                if resp.status_code == 200:
                    healthy = True
                    print(f"  ✅ {svc['name']} is healthy ({svc['health_url']})")
                    break
            except Exception:
                time.sleep(0.5)

        if not healthy:
            print(f"  ⚠️ Warning: {svc['name']} did not report healthy at {svc['health_url']}")

    print("\n==========================================================================")
    print("🌟 ALL BACKEND SERVICES RUNNING! Press Ctrl+C to stop all services.")
    print("==========================================================================")
    return processes


def stop_services(processes):
    print("\n🧹 Shutting down all ClimaLenz backend services...")
    for svc, proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=3.0)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
        print(f"  └─ Stopped {svc['name']}")
    print("✨ Shutdown complete.")


def main():
    procs = start_services()

    def signal_handler(sig, frame):
        stop_services(procs)
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        while True:
            time.sleep(1)
            for svc, proc in procs:
                if proc.poll() is not None:
                    print(f"⚠️ {svc['name']} exited unexpectedly with code {proc.returncode}")
    except KeyboardInterrupt:
        stop_services(procs)
    except Exception as e:
        print(f"Error: {e}")
        stop_services(procs)


if __name__ == "__main__":
    main()

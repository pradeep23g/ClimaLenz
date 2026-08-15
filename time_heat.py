import os
import sys
import time
import subprocess
import requests

def main():
    env = os.environ.copy()
    env["PYTHONPATH"] = "backend/heat_engine"
    env["CLIMALENZ_LOCAL_MOCK_API"] = "1"
    
    print("Starting heat_engine...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8002"],
        cwd="backend/heat_engine",
        env=env,
        stdout=None,
        stderr=None
    )
    
    # Wait for health
    for _ in range(30):
        try:
            if requests.get("http://127.0.0.1:8002/health/status").status_code == 200:
                break
        except Exception:
            time.sleep(0.5)
            
    payload = {
        "bbox": [80.22, 13.04, 80.23, 13.05],
        "date_range": "2023-01-01/2023-01-31",
        "intervention_type": "CANOPY",
        "delta": 0.15
    }

    try:
        t0 = time.time()
        r1 = requests.post("http://127.0.0.1:8002/v1/simulations/what-if", json=payload)
        t1 = time.time()
        print(f"Request 1: {t1 - t0:.2f}s (Status: {r1.status_code})")
        
        t2 = time.time()
        r2 = requests.post("http://127.0.0.1:8002/v1/simulations/what-if", json=payload)
        t3 = time.time()
        print(f"Request 2: {t3 - t2:.2f}s (Status: {r2.status_code})")
    finally:
        proc.terminate()

if __name__ == "__main__":
    main()

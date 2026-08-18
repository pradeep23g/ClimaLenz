import requests
import json
import time
import sys

AGENT_URL = "http://127.0.0.1:8004"

def test_copilot():
    print("\n--- Testing Copilot ---")
    payload = {
        "session_id": "test_session_123",
        "prompt": "What is the water score in Chennai?"
    }
    t0 = time.time()
    try:
        r = requests.post(f"{AGENT_URL}/api/copilot/chat", json=payload, timeout=60)
        t1 = time.time()
        print(f"Status Code: {r.status_code}")
        print(f"Latency: {t1 - t0:.2f}s")
        if r.status_code == 200:
            print(f"Response: {json.dumps(r.json(), indent=2)}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def test_historian():
    print("\n--- Testing Historian ---")
    payload = {
        "session_id": "test_session_123",
        "aoi_name": "Chennai",
        "engine_context": {"water_score": 0.3, "heat_delta": 1.2}
    }
    t0 = time.time()
    try:
        r = requests.post(f"{AGENT_URL}/api/historian/ground", json=payload, timeout=60)
        t1 = time.time()
        print(f"Status Code: {r.status_code}")
        print(f"Latency: {t1 - t0:.2f}s")
        if r.status_code == 200:
            print(f"Response: {json.dumps(r.json(), indent=2)}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_copilot()
    test_historian()

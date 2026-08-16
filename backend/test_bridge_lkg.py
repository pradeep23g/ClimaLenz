import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
import copy
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "bridge")))

import httpx

from app.main import app
from app.models import CoLocationRequest
from fastapi.testclient import TestClient

client = TestClient(app)

# Mock data
MOCK_GEOMETRY = {
    "type": "Polygon",
    "coordinates": [[[80.20, 13.00], [80.25, 13.00], [80.25, 13.05], [80.20, 13.05], [80.20, 13.00]]]
}

MOCK_WATER_REPORT_REAL = {
    "scene_identifier": "mock_stac_123",
    "data_provider": "planetary_computer",
    "capture_timestamp_utc": "2026-08-16T12:00:00Z",
    "cloud_cover_percentage": 5.0,
    "spatial_domain": "TERRESTRIAL",
    "water_coverage_fraction": 0.1,
    "flooded_vegetation_fraction": 0.05,
    "spectral_indices": [],
    "ecological_risk": {"aggregate_score": 0.8, "tier": 3},
    "data_confidence": {"band": "HIGH", "score": 90.0},
    "requires_ground_truth_audit": False,
    "pipeline_warnings": []
}

MOCK_WATER_REPORT_SYNTHETIC = copy.deepcopy(MOCK_WATER_REPORT_REAL)
MOCK_WATER_REPORT_SYNTHETIC["data_provider"] = "synthetic_provider"

MOCK_HEAT_RESULT = {
    "intervention_type": "CANOPY",
    "delta": 0.15,
    "guardrail_status": "PASSED",
    "delta_t_grid": [[-1.2, -1.5], [-1.0, -1.1]],
    "visualization_base64": None
}

class TestLKGPersistence(unittest.TestCase):
    
    @patch("app.main.fetch_water_assessment")
    @patch("app.main.fetch_heat_simulation")
    @patch("app.main.save_verified_snapshot")
    @patch("app.main.get_latest_compatible_snapshot")
    def test_1_live_computation_success(self, mock_get_lkg, mock_save, mock_heat, mock_water):
        # TEST 1: Live computation succeeds.
        mock_water.return_value = MOCK_WATER_REPORT_REAL
        mock_heat.return_value = MOCK_HEAT_RESULT
        
        response = client.post("/v1/colocation/assess", json={"spatial_geometry": MOCK_GEOMETRY})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Expected: snapshot saved, is_verified = true, execution_mode = LIVE
        mock_save.assert_called_once()
        self.assertEqual(data["execution_mode"], "LIVE")
        self.assertTrue(data["is_verified"])
        self.assertTrue(data["is_live"])

    @patch("app.main.fetch_water_assessment")
    @patch("app.main.fetch_heat_simulation")
    @patch("app.main.save_verified_snapshot")
    @patch("app.main.get_latest_compatible_snapshot")
    def test_2_live_computation_fails_valid_lkg_exists(self, mock_get_lkg, mock_save, mock_heat, mock_water):
        # TEST 2: Live computation fails. Valid recent snapshot exists.
        mock_water.side_effect = Exception("Water Engine Down")
        
        mock_lkg = {
            "id": "1234",
            "computed_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "bridge_result": {
                "triggered": True,
                "water_score": 0.8,
                "water_tier": "HIGH",
                "water_confidence_band": "HIGH",
                "heat_guardrail_status": "PASSED",
                "heat_intervention_type": "CANOPY",
                "heat_delta_summary": {"min": -1.5, "max": -1.0, "mean": -1.2},
                "narrative": "Cached narrative",
                "stage_timings": {"water_engine_s": 1.0, "heat_engine_s": 2.0, "total_s": 3.0}
            }
        }
        mock_get_lkg.return_value = mock_lkg
        
        response = client.post("/v1/colocation/assess", json={"spatial_geometry": MOCK_GEOMETRY})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Expected: cached snapshot returned, execution_mode = CACHED, original computed_at preserved
        mock_save.assert_not_called()
        self.assertEqual(data["execution_mode"], "CACHED")
        self.assertFalse(data["is_live"])
        self.assertTrue(data["is_verified"])
        self.assertEqual(data["computed_at"], mock_lkg["computed_at"])
        self.assertIn("Water HTTP Error", data["fallback_reason"])
        self.assertEqual(data["snapshot_id"], "1234")

    @patch("app.main.fetch_water_assessment")
    @patch("app.main.fetch_heat_simulation")
    @patch("app.main.save_verified_snapshot")
    @patch("app.main.get_latest_compatible_snapshot")
    def test_4_5_live_computation_fails_no_valid_lkg(self, mock_get_lkg, mock_save, mock_heat, mock_water):
        # TEST 4/5: Live fails, no valid LKG exists (or expired/incompatible)
        mock_water.side_effect = Exception("Water Engine Down")
        mock_get_lkg.return_value = None # No LKG
        
        response = client.post("/v1/colocation/assess", json={"spatial_geometry": MOCK_GEOMETRY})
        
        # Expected: UNAVAILABLE (503)
        self.assertEqual(response.status_code, 503)
        self.assertIn("no valid LKG snapshot exists", response.json()["detail"])

    @patch("app.main.fetch_water_assessment")
    @patch("app.main.fetch_heat_simulation")
    @patch("app.main.save_verified_snapshot")
    @patch("app.main.get_latest_compatible_snapshot")
    def test_6_synthetic_fallback_and_lkg_exists(self, mock_get_lkg, mock_save, mock_heat, mock_water):
        # TEST 6: Synthetic fallback exists AND valid LKG exists.
        mock_water.return_value = MOCK_WATER_REPORT_SYNTHETIC
        mock_heat.return_value = MOCK_HEAT_RESULT
        
        mock_lkg = {
            "id": "5678",
            "computed_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "bridge_result": {
                "triggered": True,
                "water_score": 0.9,
                "water_tier": "CRITICAL",
                "water_confidence_band": "HIGH",
                "heat_guardrail_status": "PASSED",
                "heat_intervention_type": "CANOPY",
                "heat_delta_summary": {"min": -1.5, "max": -1.0, "mean": -1.2},
                "narrative": "Cached narrative",
                "stage_timings": {"water_engine_s": 1.0, "heat_engine_s": 2.0, "total_s": 3.0}
            }
        }
        mock_get_lkg.return_value = mock_lkg
        
        response = client.post("/v1/colocation/assess", json={"spatial_geometry": MOCK_GEOMETRY})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Expected: LKG wins, synthetic fallback is NOT used.
        mock_save.assert_not_called()
        self.assertEqual(data["execution_mode"], "CACHED")
        self.assertEqual(data["snapshot_id"], "5678")

    @patch("app.main.fetch_water_assessment")
    @patch("app.main.fetch_heat_simulation")
    @patch("app.main.save_verified_snapshot")
    @patch("app.main.get_latest_compatible_snapshot")
    def test_7_synthetic_fallback_no_lkg(self, mock_get_lkg, mock_save, mock_heat, mock_water):
        # TEST 7: Synthetic fallback is used because no LKG exists
        mock_water.return_value = MOCK_WATER_REPORT_SYNTHETIC
        mock_heat.return_value = MOCK_HEAT_RESULT
        mock_get_lkg.return_value = None
        
        response = client.post("/v1/colocation/assess", json={"spatial_geometry": MOCK_GEOMETRY})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Expected: execution_mode = SYNTHETIC, is_verified = false
        mock_save.assert_not_called()
        self.assertEqual(data["execution_mode"], "SYNTHETIC")
        self.assertEqual(data["data_status"], "DEGRADED_SYNTHETIC")
        self.assertFalse(data["is_verified"])
        self.assertFalse(data["is_live"])

    @patch("app.main.fetch_water_assessment")
    @patch("app.main.fetch_heat_simulation")
    @patch("app.main.save_verified_snapshot")
    @patch("app.main.get_latest_compatible_snapshot")
    def test_9_partial_failure(self, mock_get_lkg, mock_save, mock_heat, mock_water):
        # TEST 9: Partial Water/Heat failure.
        mock_water.return_value = MOCK_WATER_REPORT_REAL
        mock_heat.side_effect = Exception("Heat Engine Down")
        mock_get_lkg.return_value = None
        
        response = client.post("/v1/colocation/assess", json={"spatial_geometry": MOCK_GEOMETRY})
        
        # Expected: No false complete snapshot, response is UNAVAILABLE
        mock_save.assert_not_called()
        self.assertEqual(response.status_code, 503)
        self.assertIn("Heat HTTP Error: Heat Engine Down", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()

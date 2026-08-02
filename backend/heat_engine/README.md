# ClimaLenz Heat Engine

Physics-informed neural network (PINN) service for simulating urban heat
micro-climate interventions (tree canopy, cool roofs, albedo changes) over
Chennai, validated against a thermodynamic guardrail before results are
returned.

## Layout

```
app/
  main.py                      FastAPI app -- POST /v1/simulations/what-if
  pipeline.py                  Orchestrates: load data -> load PINN -> run what-if -> guardrail
  models/
    thermal_defs.py            InterventionType / ESAWorldCoverClass / GuardrailStatus enums
    simulation_schemas.py      Request/response Pydantic schemas
  services/
    model_arch.py              ThermalCNN architecture (3-channel CNN)
    model_loader.py            Loads trained weights from artifacts/*.pt
    preprocessing.py           MODIS LST, Sentinel-2 NDVI, ESA WorldCover -> numpy grids
    physics_guardrail.py       Rejects physically implausible simulated deltas
    what_if_engine.py          Runs the intervention forward through the PINN
    visualization.py           4-panel Baseline / PINN / Ground Truth / Error-delta plot
    satellite/
      base.py                  ThermalDataClient structural interface
      client_factory.py        Picks live vs. synthetic client (CLIMALENZ_LOCAL_MOCK_API)
      planetary_thermal_client.py   Live Microsoft Planetary Computer client
      synthetic_thermal_client.py   Deterministic offline/CI mock client
training/
  dataset.py                   GridLSTDataset + chronological (non-leaky) train/val split
  laplacian.py                 Discrete Laplacian operator for the heat-diffusion residual
  train_baseline.py            Trains the physics-blind CNN -> artifacts/baseline_cnn.pt
  train_pinn.py                Warm-starts from baseline, adds physics loss -> artifacts/pinn_model.pt
  test_stress.py                Feeds an intentionally extreme delta to verify the guardrail fires
```

## Running locally

```bash
pip install -r requirements.txt

# 1. Train (writes artifacts/baseline_cnn.pt and artifacts/pinn_model.pt)
#    Feed it either live data (PlanetaryThermalClient) or synthetic data
#    (SyntheticThermalClient) via app/services/satellite/client_factory.py.

# 2. Serve the trained model
export CLIMALENZ_LOCAL_MOCK_API=1   # set to 0 to hit live Planetary Computer instead
uvicorn app.main:app --reload
```

`artifacts/*.pt` are intentionally gitignored -- train locally to generate
them before starting the API, or the `/v1/simulations/what-if` endpoint will
return a `503` telling you to do so.

## Status

Water engine (`../water_engine`) is fully wired end-to-end. Heat engine's
core physics (dynamic per-landcover thermal diffusivity, chronological
train/val split, physics guardrail, stress test) is implemented and tested;
the API/plumbing layer above it was completed in this pass.

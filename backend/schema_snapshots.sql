-- SQL Schema for ClimaLenz Supabase Project
-- Assessment Snapshots for Verified State Cache / LKG Recovery

CREATE TABLE IF NOT EXISTS assessment_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    geometry_hash TEXT NOT NULL,
    
    -- Request configuration
    geometry JSONB NOT NULL,
    intervention_type TEXT NOT NULL,
    delta NUMERIC NOT NULL,
    lookback_days INTEGER NOT NULL,
    cloud_tolerance_pct NUMERIC NOT NULL,
    
    -- Water
    water_score NUMERIC NOT NULL,
    water_tier TEXT NOT NULL,
    water_confidence_band TEXT,
    water_metadata JSONB,
    
    -- Heat
    heat_guardrail_status TEXT NOT NULL,
    heat_intervention_type TEXT NOT NULL,
    heat_delta_summary JSONB NOT NULL,
    heat_data_provenance TEXT,
    
    -- CoLocation
    colocation_triggered BOOLEAN NOT NULL,
    colocation_narrative TEXT NOT NULL,
    stage_timings JSONB,
    
    -- Trust
    provenance TEXT NOT NULL,
    scene_confidence NUMERIC,
    caveats JSONB,
    
    status TEXT NOT NULL,
    
    timestamp_utc TIMESTAMPTZ DEFAULT now()
);

-- Index for fast LKG lookups by geometry hash, ordered by timestamp_utc
CREATE INDEX IF NOT EXISTS idx_snapshots_geometry_hash_time ON assessment_snapshots(geometry_hash, timestamp_utc DESC);

-- Enable RLS
ALTER TABLE assessment_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow SELECT & INSERT Policies
CREATE POLICY "Allow read access on assessment_snapshots" ON assessment_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow insert access on assessment_snapshots" ON assessment_snapshots FOR INSERT WITH CHECK (true);

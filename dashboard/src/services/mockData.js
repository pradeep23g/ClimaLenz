/**
 * Climalenz Climate Intelligence Dataset
 * Engine Layers: Water Engine, Heat Engine, Continuity Engine, Bridge Pipeline, Vertex AI Agents
 */

export const PRESET_CITIES = [
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    lat: 19.0760,
    lng: 72.8777,
    zoom: 12,
    waterEngine: {
      soilMoisture: 32, // %
      evapotranspiration: 4.1, // mm
      catchmentLevel: 75, // %
      predictedRunoff: 1.35, // mm/h
      precipitationRate: 1.35, // mm/h
      cloudCover: 0.20, // %
      surfaceMoistureTemp: 4.1, // mm equivalent
      ambientTemp: -23.0, // °C baseline
      formula: 'Q = P - E - ΔS',
      coefficients: { c1: 0.35, c2: 0.42, c3: 0.18 },
      timeSeries: [
        { time: 'Jan', soilMoisture: 45, evapotranspiration: 2.1, catchment: 85 },
        { time: 'Feb', soilMoisture: 40, evapotranspiration: 2.8, catchment: 80 },
        { time: 'May', soilMoisture: 28, evapotranspiration: 5.2, catchment: 65 },
        { time: 'Jul', soilMoisture: 82, evapotranspiration: 6.8, catchment: 92 },
        { time: 'Aug', soilMoisture: 75, evapotranspiration: 5.9, catchment: 88 },
        { time: 'Sep', soilMoisture: 62, evapotranspiration: 4.1, catchment: 75 }
      ]
    },
    heatEngine: {
      lstAvg: 37.4, // °C
      ambientTemp: 30.5,
      uhiDelta: 5.4, // °C
      thermalAnomalies: 14,
      albedoIndex: 0.18,
      urbanCanopyTemp: 39.8,
      formula: 'LST = T_rad / (1 + (λ T_rad / ρ) ln ε)',
      coefficients: { c1: 0.48, c2: 0.32, c3: 0.20 },
      diurnalTrend: [
        { hour: '00:00', urban: 28.4, rural: 24.1, delta: 4.3 },
        { hour: '03:00', urban: 27.2, rural: 22.5, delta: 4.7 },
        { hour: '06:00', urban: 26.8, rural: 22.0, delta: 4.8 },
        { hour: '09:00', urban: 31.5, rural: 27.8, delta: 3.7 },
        { hour: '12:00', urban: 37.8, rural: 32.4, delta: 5.4 },
        { hour: '15:00', urban: 39.2, rural: 33.1, delta: 6.1 },
        { hour: '18:00', urban: 34.6, rural: 29.5, delta: 5.1 },
        { hour: '21:00', urban: 30.8, rural: 26.0, delta: 4.8 }
      ]
    },
    continuityEngine: {
      stabilityIndex: 0.74, // 0 to 1
      vegetationContinuity: 0.68,
      soilDegradationRisk: 'Low-Medium',
      continuityScore: 82,
      riskProjection: 'Stable',
      formula: 'ESI = (NDVI × C1) + (EVI × C2) - (Risk × C3)',
      coefficients: { c1: 0.50, c2: 0.35, c3: 0.15 },
      historicalTrend: [
        { year: '2016', lstMax: 33.5, greenCover: 28, builtupPercent: 68, stability: 0.88 },
        { year: '2018', lstMax: 34.2, greenCover: 26, builtupPercent: 72, stability: 0.84 },
        { year: '2020', lstMax: 35.1, greenCover: 24, builtupPercent: 76, stability: 0.80 },
        { year: '2022', lstMax: 36.4, greenCover: 21, builtupPercent: 80, stability: 0.77 },
        { year: '2024', lstMax: 37.1, greenCover: 19, builtupPercent: 83, stability: 0.75 },
        { year: '2026', lstMax: 37.8, greenCover: 17, builtupPercent: 86, stability: 0.74 }
      ]
    },
    zones: [
      {
        id: 'bkcregion',
        name: 'Bandra-Kurla Complex (Commercial District)',
        coords: [
          [19.068, 72.862],
          [19.075, 72.875],
          [19.062, 72.880],
          [19.055, 72.868]
        ],
        lst: 39.8,
        soilMoisture: 22,
        evapotranspiration: 2.9,
        catchment: 58,
        ndvi: 0.14,
        builtup: 92,
        severity: 'Severe Anomaly',
        recommendation: 'Extreme concrete retention & glass reflection detected. High evapotranspiration deficit.'
      },
      {
        id: 'sanjaygandhi',
        name: 'Sanjay Gandhi National Park (Green Buffer)',
        coords: [
          [19.220, 72.890],
          [19.245, 72.920],
          [19.200, 72.935],
          [19.180, 72.900]
        ],
        lst: 28.5,
        soilMoisture: 68,
        evapotranspiration: 6.2,
        catchment: 94,
        ndvi: 0.76,
        builtup: 12,
        severity: 'Normal / Optimum',
        recommendation: 'Optimal hydrologic continuity and ecological stability buffer.'
      },
      {
        id: 'dharavi',
        name: 'Dharavi Central Zone (High Density Built-up)',
        coords: [
          [19.040, 72.850],
          [19.048, 72.860],
          [19.038, 72.865],
          [19.032, 72.855]
        ],
        lst: 38.6,
        soilMoisture: 18,
        evapotranspiration: 1.8,
        catchment: 42,
        ndvi: 0.08,
        builtup: 96,
        severity: 'Critical Hydrologic Deficit',
        recommendation: 'High surface run-off risk and minimal moisture retention. Cool roofing required.'
      }
    ],
    thermalGrid: generateGridPoints(19.0760, 72.8777, 37.4, 0.22)
  },
  {
    id: 'delhi',
    name: 'Delhi NCR',
    country: 'India',
    lat: 28.6139,
    lng: 77.2090,
    zoom: 11,
    waterEngine: {
      soilMoisture: 24,
      evapotranspiration: 3.2,
      catchmentLevel: 62,
      predictedRunoff: 1.85,
      precipitationRate: 0.45,
      cloudCover: 0.12,
      surfaceMoistureTemp: 3.2,
      ambientTemp: -18.5,
      formula: 'Q = P - E - ΔS',
      coefficients: { c1: 0.40, c2: 0.35, c3: 0.25 },
      timeSeries: [
        { time: 'Jan', soilMoisture: 38, evapotranspiration: 1.8, catchment: 72 },
        { time: 'Feb', soilMoisture: 32, evapotranspiration: 2.2, catchment: 68 },
        { time: 'May', soilMoisture: 15, evapotranspiration: 4.8, catchment: 45 },
        { time: 'Jul', soilMoisture: 70, evapotranspiration: 6.2, catchment: 85 },
        { time: 'Aug', soilMoisture: 65, evapotranspiration: 5.4, catchment: 82 },
        { time: 'Sep', soilMoisture: 50, evapotranspiration: 3.8, catchment: 70 }
      ]
    },
    heatEngine: {
      lstAvg: 41.5,
      ambientTemp: 34.1,
      uhiDelta: 7.4,
      thermalAnomalies: 28,
      albedoIndex: 0.14,
      urbanCanopyTemp: 43.2,
      formula: 'LST = T_rad / (1 + (λ T_rad / ρ) ln ε)',
      coefficients: { c1: 0.52, c2: 0.30, c3: 0.18 },
      diurnalTrend: [
        { hour: '00:00', urban: 31.0, rural: 25.2, delta: 5.8 },
        { hour: '03:00', urban: 29.5, rural: 23.4, delta: 6.1 },
        { hour: '06:00', urban: 28.9, rural: 22.8, delta: 6.1 },
        { hour: '09:00', urban: 35.8, rural: 30.1, delta: 5.7 },
        { hour: '12:00', urban: 42.4, rural: 35.6, delta: 6.8 },
        { hour: '15:00', urban: 44.5, rural: 37.1, delta: 7.4 },
        { hour: '18:00', urban: 39.1, rural: 32.5, delta: 6.6 },
        { hour: '21:00', urban: 34.2, rural: 28.0, delta: 6.2 }
      ]
    },
    continuityEngine: {
      stabilityIndex: 0.61,
      vegetationContinuity: 0.52,
      soilDegradationRisk: 'High',
      continuityScore: 68,
      riskProjection: 'Elevated Risk',
      formula: 'ESI = (NDVI × C1) + (EVI × C2) - (Risk × C3)',
      coefficients: { c1: 0.45, c2: 0.30, c3: 0.25 },
      historicalTrend: [
        { year: '2016', lstMax: 37.8, greenCover: 24, builtupPercent: 74, stability: 0.78 },
        { year: '2018', lstMax: 38.6, greenCover: 22, builtupPercent: 78, stability: 0.74 },
        { year: '2020', lstMax: 39.5, greenCover: 20, builtupPercent: 81, stability: 0.70 },
        { year: '2022', lstMax: 40.8, greenCover: 18, builtupPercent: 84, stability: 0.66 },
        { year: '2024', lstMax: 41.9, greenCover: 16, builtupPercent: 87, stability: 0.63 },
        { year: '2026', lstMax: 42.8, greenCover: 15, builtupPercent: 89, stability: 0.61 }
      ]
    },
    zones: [
      {
        id: 'connaught',
        name: 'Connaught Place & CBD',
        coords: [
          [28.625, 77.210],
          [28.638, 77.225],
          [28.622, 77.230],
          [28.615, 77.215]
        ],
        lst: 43.2,
        soilMoisture: 14,
        evapotranspiration: 1.5,
        catchment: 40,
        ndvi: 0.19,
        builtup: 91,
        severity: 'Severe UHI',
        recommendation: 'Dense asphalt roads trapping heat. Implement bioswales and water misters.'
      },
      {
        id: 'delhiridge',
        name: 'Northern & Central Ridge Reserve',
        coords: [
          [28.680, 77.170],
          [28.700, 77.185],
          [28.670, 77.200],
          [28.655, 77.180]
        ],
        lst: 32.1,
        soilMoisture: 58,
        evapotranspiration: 5.4,
        catchment: 88,
        ndvi: 0.68,
        builtup: 18,
        severity: 'Normal',
        recommendation: 'Protect native forest canopy for thermal stabilization.'
      }
    ],
    thermalGrid: generateGridPoints(28.6139, 77.2090, 41.5, 0.18)
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    country: 'India',
    lat: 12.9716,
    lng: 77.5946,
    zoom: 12,
    waterEngine: {
      soilMoisture: 42,
      evapotranspiration: 4.8,
      catchmentLevel: 81,
      predictedRunoff: 1.10,
      precipitationRate: 2.10,
      cloudCover: 0.35,
      surfaceMoistureTemp: 4.8,
      ambientTemp: -15.0,
      formula: 'Q = P - E - ΔS',
      coefficients: { c1: 0.30, c2: 0.45, c3: 0.25 },
      timeSeries: [
        { time: 'Jan', soilMoisture: 50, evapotranspiration: 3.1, catchment: 88 },
        { time: 'Feb', soilMoisture: 45, evapotranspiration: 3.5, catchment: 85 },
        { time: 'May', soilMoisture: 35, evapotranspiration: 5.8, catchment: 72 },
        { time: 'Jul', soilMoisture: 78, evapotranspiration: 6.9, catchment: 94 },
        { time: 'Aug', soilMoisture: 72, evapotranspiration: 6.1, catchment: 90 },
        { time: 'Sep', soilMoisture: 60, evapotranspiration: 4.8, catchment: 81 }
      ]
    },
    heatEngine: {
      lstAvg: 34.8,
      ambientTemp: 28.2,
      uhiDelta: 5.1,
      thermalAnomalies: 9,
      albedoIndex: 0.22,
      urbanCanopyTemp: 37.5,
      formula: 'LST = T_rad / (1 + (λ T_rad / ρ) ln ε)',
      coefficients: { c1: 0.40, c2: 0.38, c3: 0.22 },
      diurnalTrend: [
        { hour: '00:00', urban: 22.4, rural: 19.1, delta: 3.3 },
        { hour: '03:00', urban: 21.2, rural: 17.8, delta: 3.4 },
        { hour: '06:00', urban: 20.8, rural: 17.2, delta: 3.6 },
        { hour: '09:00', urban: 26.5, rural: 23.1, delta: 3.4 },
        { hour: '12:00', urban: 32.8, rural: 28.2, delta: 4.6 },
        { hour: '15:00', urban: 34.5, rural: 29.4, delta: 5.1 },
        { hour: '18:00', urban: 29.8, rural: 25.4, delta: 4.4 },
        { hour: '21:00', urban: 25.1, rural: 21.5, delta: 3.6 }
      ]
    },
    continuityEngine: {
      stabilityIndex: 0.81,
      vegetationContinuity: 0.75,
      soilDegradationRisk: 'Low',
      continuityScore: 89,
      riskProjection: 'Optimal',
      formula: 'ESI = (NDVI × C1) + (EVI × C2) - (Risk × C3)',
      coefficients: { c1: 0.55, c2: 0.30, c3: 0.15 },
      historicalTrend: [
        { year: '2016', lstMax: 31.2, greenCover: 42, builtupPercent: 55, stability: 0.91 },
        { year: '2018', lstMax: 32.1, greenCover: 37, builtupPercent: 61, stability: 0.88 },
        { year: '2020', lstMax: 33.0, greenCover: 32, builtupPercent: 67, stability: 0.85 },
        { year: '2022', lstMax: 33.9, greenCover: 28, builtupPercent: 72, stability: 0.83 },
        { year: '2024', lstMax: 34.7, greenCover: 24, builtupPercent: 77, stability: 0.82 },
        { year: '2026', lstMax: 35.4, greenCover: 21, builtupPercent: 81, stability: 0.81 }
      ]
    },
    zones: [
      {
        id: 'whitefield',
        name: 'Whitefield Tech Corridor',
        coords: [
          [12.975, 77.730],
          [12.990, 77.755],
          [12.960, 77.765],
          [12.945, 77.740]
        ],
        lst: 37.5,
        soilMoisture: 28,
        evapotranspiration: 3.2,
        catchment: 65,
        ndvi: 0.21,
        builtup: 87,
        severity: 'Moderate UHI',
        recommendation: 'Loss of lake wetlands. Implement bioswales and cool roof coatings.'
      },
      {
        id: 'cubbonpark',
        name: 'Cubbon Park & Lalbagh Sanctuary',
        coords: [
          [12.970, 77.585],
          [12.982, 77.595],
          [12.965, 77.605],
          [12.955, 77.590]
        ],
        lst: 29.2,
        soilMoisture: 72,
        evapotranspiration: 6.8,
        catchment: 96,
        ndvi: 0.65,
        builtup: 22,
        severity: 'Normal',
        recommendation: 'Core urban cooling island providing 3.5°C buffer.'
      }
    ],
    thermalGrid: generateGridPoints(12.9716, 77.5946, 34.8, 0.35)
  }
];

// API key management removed from frontend per security guidelines.
// Keys are handled securely by the backend Python pipeline only.

export const SATELLITE_SOURCES = [
  'Sentinel-2, Landsat-8',
  'Sentinel-2 (10m Resolution)',
  'Landsat-8 (30m Thermal TIRS)',
  'MODIS / VIIRS (Daily Global)',
  'PlanetScope SuperDove (3m High-Res)'
];

export const BRIDGE_PIPELINE_STATUS = {
  health: '98.6% Operational',
  latency: '78ms',
  lastSync: '2 minutes ago',
  activeEngineStreams: [
    { name: 'Water Engine Pipeline', status: 'Active', latency: '45ms', throughput: '1.2 GB/s' },
    { name: 'Heat Engine Pipeline', status: 'Active', latency: '62ms', throughput: '850 MB/s' },
    { name: 'Continuity Engine Pipeline', status: 'Active', latency: '88ms', throughput: '640 MB/s' },
    { name: 'Agents Query Stream', status: 'Active', latency: '35ms', throughput: '210 MB/s' }
  ]
};

export const AI_AGENT_LOGS = [
  { id: 1, timestamp: '19:18:42', engine: 'Water Engine', type: 'Insight', message: 'Evapotranspiration anomaly detected in Dharavi region (deficit: -2.3 mm/day).' },
  { id: 2, timestamp: '19:15:10', engine: 'Heat Engine', type: 'Alert', message: 'Surface temperature spike registered at Bandra-Kurla Complex (+3.2°C above baseline).' },
  { id: 3, timestamp: '19:02:55', engine: 'Continuity Engine', type: 'Synthesis', message: 'Ecological stability index updated for Mumbai region (ESI: 0.74 - Stable).' },
  { id: 4, timestamp: '18:45:12', engine: 'Bridge Layer', type: 'System', message: 'Sentinel-2 L2A orbital pass successfully ingested into formula processor.' }
];

function generateGridPoints(centerLat, centerLng, baseLst, baseNdvi) {
  const points = [];
  const rows = 9;
  const cols = 9;
  const step = 0.012;
  
  for (let i = -Math.floor(rows / 2); i <= Math.floor(rows / 2); i++) {
    for (let j = -Math.floor(cols / 2); j <= Math.floor(cols / 2); j++) {
      const dist = Math.sqrt(i * i + j * j);
      const tempVariance = (4.5 - dist * 0.8) + (Math.sin(i * 1.5 + j) * 1.2);
      const lst = parseFloat((baseLst + tempVariance).toFixed(1));
      const ndvi = parseFloat(Math.max(0.05, Math.min(0.85, baseNdvi - tempVariance * 0.05)).toFixed(2));
      const builtup = Math.min(98, Math.max(15, Math.round(75 + tempVariance * 4)));
      
      points.push({
        lat: centerLat + i * step,
        lng: centerLng + j * step,
        lst: lst,
        ndvi: ndvi,
        builtup: builtup,
        intensity: Math.min(1.0, Math.max(0.1, (lst - 25) / 20))
      });
    }
  }
  return points;
}

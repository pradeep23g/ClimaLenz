/**
 * Custom React Hook: useClimalenzData
 * Manages engine selections, satellite sources, formula coefficients, live metric feeds, and pipeline diagnostics.
 * Updated to remove all API keys per user instructions.
 */
import { useState, useCallback, useMemo } from 'react';
import { 
  PRESET_CITIES, 
  SATELLITE_SOURCES, 
  BRIDGE_PIPELINE_STATUS,
  AI_AGENT_LOGS 
} from '../services/mockData';

export function useClimalenzData(initialCityId = 'mumbai') {
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);
  const [customCityOverride, setCustomCityOverride] = useState(null);
  const [activeEngine, setActiveEngine] = useState('water'); // 'overview' | 'water' | 'heat' | 'continuity' | 'bridge' | 'agents' | 'map_view' | 'alerts' | 'settings'
  const [selectedSatellite, setSelectedSatellite] = useState(SATELLITE_SOURCES[0]);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  
  // Custom coefficients for formula processor per engine
  const [coefficients, setCoefficients] = useState({
    c1: 0.35,
    c2: 0.42,
    c3: 0.18
  });

  // Current active city
  const currentCity = useMemo(() => {
    if (customCityOverride) return customCityOverride;
    return PRESET_CITIES.find(c => c.id === selectedCityId) || PRESET_CITIES[0];
  }, [selectedCityId, customCityOverride]);

  // Set custom city override when searching locations on map
  const setCurrentCityOverride = useCallback((cityObj) => {
    const fullCity = {
      id: cityObj.id || 'custom',
      name: cityObj.name || 'Searched Location',
      country: cityObj.country || 'Global',
      lat: cityObj.lat,
      lng: cityObj.lng,
      zoom: cityObj.zoom || 12,
      waterEngine: {
        soilMoisture: 36,
        evapotranspiration: 4.2,
        catchmentLevel: 78,
        predictedRunoff: 1.25,
        precipitationRate: 1.20,
        cloudCover: 0.15,
        surfaceMoistureTemp: 4.2,
        ambientTemp: -20.0,
        formula: 'Q = P - E - ΔS',
        timeSeries: PRESET_CITIES[0].waterEngine.timeSeries
      },
      heatEngine: PRESET_CITIES[0].heatEngine,
      continuityEngine: PRESET_CITIES[0].continuityEngine,
      zones: PRESET_CITIES[0].zones,
      thermalGrid: PRESET_CITIES[0].thermalGrid
    };
    setCustomCityOverride(fullCity);
  }, []);

  // Handle coefficient change
  const handleCoefficientChange = useCallback((key, val) => {
    const numericVal = parseFloat(val) || 0;
    setCoefficients(prev => ({
      ...prev,
      [key]: numericVal
    }));
  }, []);

  // Trigger live backend sync / validation
  const triggerBackendSync = useCallback(() => {
    setIsLiveSyncing(true);
    setTimeout(() => {
      setIsLiveSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1200);
  }, []);

  // Calculated live prediction metrics dynamically influenced by C1, C2, C3 coefficients
  const livePredictions = useMemo(() => {
    const baseMoisture = currentCity.waterEngine ? currentCity.waterEngine.soilMoisture : 32;
    const baseEvap = currentCity.waterEngine ? currentCity.waterEngine.evapotranspiration : 4.1;
    const baseCatchment = currentCity.waterEngine ? currentCity.waterEngine.catchmentLevel : 75;

    // Formula modulation
    const modMoisture = Math.round(Math.min(99, Math.max(10, baseMoisture + (coefficients.c1 * 20 - 5))));
    const modEvap = parseFloat((baseEvap + (coefficients.c2 * 3 - 0.6)).toFixed(1));
    const modCatchment = Math.round(Math.min(99, Math.max(15, baseCatchment + (coefficients.c3 * 15 - 3))));
    const modRunoff = parseFloat((1.35 + (1 - coefficients.c1) * 0.8).toFixed(2));

    return {
      soilMoisture: modMoisture,
      evapotranspiration: modEvap,
      catchmentLevel: modCatchment,
      predictedRunoff: modRunoff
    };
  }, [currentCity, coefficients]);

  return {
    selectedCityId,
    setSelectedCityId: (id) => {
      setCustomCityOverride(null);
      setSelectedCityId(id);
    },
    currentCity,
    setCurrentCityOverride,
    presetCities: PRESET_CITIES,
    activeEngine,
    setActiveEngine,
    selectedSatellite,
    setSelectedSatellite,
    satelliteSources: SATELLITE_SOURCES,
    coefficients,
    setCoefficients,
    handleCoefficientChange,
    isLiveSyncing,
    lastSyncTime,
    triggerBackendSync,
    livePredictions,
    pipelineStatus: BRIDGE_PIPELINE_STATUS,
    agentLogs: AI_AGENT_LOGS
  };
}

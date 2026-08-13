/**
 * Custom Hook: useUhiData
 * Coordinates fetching live climate metrics (Open-Meteo, NASA POWER API, MS STAC API)
 * with robust error handling and instant mock fallbacks.
 */
import { useState, useEffect } from 'react';
import { PRESET_CITIES } from '../services/mockData';
import { fetchOpenMeteoData } from '../services/api/openMeteoApi';
import { fetchNasaPowerData } from '../services/api/nasaApi';
import { queryPlanetaryComputerStac } from '../services/api/planetaryStacApi';

export const useUhiData = (selectedCityId) => {
  const [currentCity, setCurrentCity] = useState(() => 
    PRESET_CITIES.find(c => c.id === selectedCityId) || PRESET_CITIES[0]
  );
  const [loading, setLoading] = useState(false);
  const [apiSources, setApiSources] = useState({
    weather: 'Open-Meteo API',
    nasa: 'NASA POWER / MODIS API',
    stac: 'MS Planetary Computer STAC',
    isro: 'ISRO Bhuvan / VEDAS Tile Service'
  });
  const [liveMetrics, setLiveMetrics] = useState({
    ambientTemp: currentCity.ambientTemp,
    lstAvg: currentCity.lstAvg,
    humidity: currentCity.humidity,
    windSpeed: currentCity.windSpeed,
    ndviAvg: currentCity.ndviAvg,
    builtupDensity: currentCity.builtupDensity,
    cloudCover: 12.0
  });

  useEffect(() => {
    const city = PRESET_CITIES.find(c => c.id === selectedCityId) || PRESET_CITIES[0];
    setCurrentCity(city);
    
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        // Fetch in parallel
        const [openMeteoRes, nasaRes, stacRes] = await Promise.allSettled([
          fetchOpenMeteoData(city.lat, city.lng),
          fetchNasaPowerData(city.lat, city.lng),
          queryPlanetaryComputerStac(city.lat, city.lng)
        ]);

        if (!isMounted) return;

        const openMeteo = openMeteoRes.status === 'fulfilled' ? openMeteoRes.value : null;
        const nasa = nasaRes.status === 'fulfilled' ? nasaRes.value : null;
        const stac = stacRes.status === 'fulfilled' ? stacRes.value : null;

        setLiveMetrics({
          ambientTemp: openMeteo?.currentTemp ?? city.ambientTemp,
          lstAvg: nasa?.lst ?? (openMeteo?.surfaceTemp ?? city.lstAvg),
          humidity: openMeteo?.humidity ?? city.humidity,
          windSpeed: openMeteo?.windSpeed ?? city.windSpeed,
          ndviAvg: city.ndviAvg,
          builtupDensity: city.builtupDensity,
          cloudCover: stac?.cloudCover ?? 10.5
        });

        setApiSources({
          weather: openMeteo?.isLive ? 'Open-Meteo (Live)' : 'Open-Meteo Baseline',
          nasa: nasa?.isLive ? 'NASA POWER (Live MODIS)' : 'NASA POWER Baseline',
          stac: stac?.isLive ? `MS STAC (${stac.collection})` : 'Planetary Computer Baseline',
          isro: 'ISRO Bhuvan / VEDAS Integration'
        });

      } catch (err) {
        console.warn('Error fetching live satellite & weather API pipelines:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCityId]);

  return {
    currentCity,
    liveMetrics,
    loading,
    apiSources,
    presetCities: PRESET_CITIES
  };
};

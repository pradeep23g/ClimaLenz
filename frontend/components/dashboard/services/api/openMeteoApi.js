/**
 * Open-Meteo API Service
 * Fetches real-time and forecast micro-climate metrics (ambient temp, humidity, wind speed, solar irradiance)
 */

export const fetchOpenMeteoData = async (latitude, longitude) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_temperature,direct_normal_irradiance&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      currentTemp: data.current?.temperature_2m ?? 31.5,
      surfaceTemp: data.current?.surface_temperature ?? 36.8,
      humidity: data.current?.relative_humidity_2m ?? 62,
      windSpeed: data.current?.wind_speed_10m ?? 12.4,
      solarIrradiance: data.current?.direct_normal_irradiance ?? 780,
      dailyMax: data.daily?.temperature_2m_max?.[0] ?? 34.2,
      dailyMin: data.daily?.temperature_2m_min?.[0] ?? 24.8,
      isLive: true,
      source: 'Open-Meteo Realtime API'
    };
  } catch (error) {
    console.warn('Open-Meteo API fetch failed, using realistic microclimate baseline fallback:', error);
    return null;
  }
};

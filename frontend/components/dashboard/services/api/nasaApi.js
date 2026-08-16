/**
 * NASA POWER & MODIS Land Surface Temperature (LST) API Service
 * Endpoint: https://power.larc.nasa.gov/api/temporal/daily/point
 */

export const fetchNasaPowerData = async (latitude, longitude) => {
  const apiKey = process.env.NEXT_PUBLIC_NASA_API_KEY;
  
  // Calculate start/end dates for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14);
  
  const formatDate = (date) => date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);
  
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,TS&community=RE&longitude=${longitude}&latitude=${latitude}&start=${startStr}&end=${endStr}&format=JSON${apiKey ? `&api_key=${apiKey}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA POWER API HTTP status: ${response.status}`);
    }
    const data = await response.json();
    const properties = data.properties?.parameter || {};
    
    // Extract recent Land Surface Temperature (TS) and Ambient Temp (T2M)
    const tsValues = Object.values(properties.TS || {}).filter(v => v !== -999);
    const t2mValues = Object.values(properties.T2M || {}).filter(v => v !== -999);
    const t2mMax = Object.values(properties.T2M_MAX || {}).filter(v => v !== -999);
    const t2mMin = Object.values(properties.T2M_MIN || {}).filter(v => v !== -999);
    
    const latestLst = tsValues.length > 0 ? (tsValues[tsValues.length - 1] + 2.5) : null;
    const latestT2m = t2mValues.length > 0 ? t2mValues[t2mValues.length - 1] : null;

    return {
      lst: latestLst ? parseFloat(latestLst.toFixed(1)) : null,
      ambientTemp: latestT2m ? parseFloat(latestT2m.toFixed(1)) : null,
      maxTemp: t2mMax.length > 0 ? parseFloat(t2mMax[t2mMax.length - 1].toFixed(1)) : null,
      minTemp: t2mMin.length > 0 ? parseFloat(t2mMin[t2mMin.length - 1].toFixed(1)) : null,
      history: properties,
      source: 'NASA POWER API (MODIS Satellite Baseline)',
      isLive: true
    };
  } catch (error) {
    console.warn('NASA POWER API fetch error, falling back to simulated NASA MODIS parameters:', error);
    return null;
  }
};

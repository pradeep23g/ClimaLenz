/**
 * GeoJSON & Polygon Polygon Boundary Processing Helpers
 */

/**
 * Calculates centroid of coordinate array [[lat, lng], ...]
 */
export const getPolygonCentroid = (coords) => {
  if (!coords || coords.length === 0) return [0, 0];
  let latSum = 0;
  let lngSum = 0;
  coords.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  return [latSum / coords.length, lngSum / coords.length];
};

/**
 * Calculates statistics for custom user drawn bounding polygon
 */
export const calculatePolygonStats = (coords, thermalGrid = []) => {
  if (!coords || coords.length < 3 || thermalGrid.length === 0) {
    return {
      avgLst: 36.5,
      avgNdvi: 0.20,
      avgBuiltup: 82,
      pointCount: 0
    };
  }

  // Find points inside bounding box of polygon
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const pointsInside = thermalGrid.filter(p => 
    p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng
  );

  if (pointsInside.length === 0) {
    return { avgLst: 36.2, avgNdvi: 0.22, avgBuiltup: 78, pointCount: 0 };
  }

  const sumLst = pointsInside.reduce((acc, p) => acc + p.lst, 0);
  const sumNdvi = pointsInside.reduce((acc, p) => acc + p.ndvi, 0);
  const sumBuiltup = pointsInside.reduce((acc, p) => acc + p.builtup, 0);

  return {
    avgLst: parseFloat((sumLst / pointsInside.length).toFixed(1)),
    avgNdvi: parseFloat((sumNdvi / pointsInside.length).toFixed(2)),
    avgBuiltup: Math.round(sumBuiltup / pointsInside.length),
    pointCount: pointsInside.length
  };
};

/**
 * Maps LST values to color hex for thermal choropleth
 */
export const getLstColor = (lst) => {
  if (lst < 28) return '#22c55e'; // Green
  if (lst < 32) return '#eab308'; // Yellow
  if (lst < 36) return '#f97316'; // Orange
  if (lst < 40) return '#ef4444'; // Red
  return '#be123c';               // Deep Crimson
};

/**
 * Maps NDVI values to color hex for vegetation layer
 */
export const getNdviColor = (ndvi) => {
  if (ndvi > 0.6) return '#15803d'; // Deep Emerald Green
  if (ndvi > 0.4) return '#22c55e'; // Light Green
  if (ndvi > 0.2) return '#ca8a04'; // Yellow Green
  return '#a16207';                // Brownish Dry
};

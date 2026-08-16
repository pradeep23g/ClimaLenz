/**
 * ISRO VEDAS / MOSDAC / Bhuvan Web Services Integration Module
 * Base URL & WMS/WMTS authentication configuration setups for Indian Earth Observation layers.
 */

export const BHUVAN_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BHUVAN_API_URL || 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
  apiKey: process.env.NEXT_PUBLIC_BHUVAN_API_KEY || '',
  layers: {
    thermalLST: 'bhuvan:LST_MODIS_DAILY',
    ndviCanopy: 'bhuvan:NDVI_2024_INDIA',
    urbanBuiltup: 'bhuvan:URBAN_BUILTUP_DENSITY'
  }
};

/**
 * Returns WMS Tile URL generator for Bhuvan or Open GIS tile services
 */
export const getBhuvanTileUrl = (layerName = 'thermalLST') => {
  const layer = BHUVAN_CONFIG.layers[layerName] || BHUVAN_CONFIG.layers.thermalLST;
  if (BHUVAN_CONFIG.apiKey) {
    return `${BHUVAN_CONFIG.baseUrl}?service=WMS&version=1.1.1&request=GetMap&layers=${layer}&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&token=${BHUVAN_CONFIG.apiKey}`;
  }
  // Standard high resolution tile fallback
  return null;
};

/**
 * Microsoft Planetary Computer STAC API Service
 * Endpoint: https://planetarycomputer.microsoft.com/api/stac/v1
 * Queries Sentinel-2 and Landsat-8/9 thermal and vegetation metadata.
 */

export const queryPlanetaryComputerStac = async (latitude, longitude) => {
  const apiKey = import.meta.env.VITE_PLANETARY_COMPUTER_KEY;
  const endpoint = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
  
  // Create small bounding box around target coordinate
  const delta = 0.05;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta
  ];
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        bbox: bbox,
        collections: ['landsat-c2-l2', 'sentinel-2-l2a'],
        limit: 5,
        datetime: '2024-01-01T00:00:00Z/2026-12-31T23:59:59Z'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Planetary Computer STAC HTTP status: ${response.status}`);
    }
    
    const result = await response.json();
    const items = result.features || [];
    
    if (items.length === 0) {
      return null;
    }
    
    // Extract cloud cover and acquisition details from STAC item
    const firstItem = items[0];
    const cloudCover = firstItem.properties['eo:cloud_cover'] ?? 12.5;
    const acquisitionDate = firstItem.properties['datetime'];
    const collection = firstItem.collection;
    
    return {
      collection: collection,
      acquisitionDate: acquisitionDate,
      cloudCover: cloudCover,
      stacItemId: firstItem.id,
      thermalBandAvailable: true,
      source: 'Microsoft Planetary Computer STAC',
      isLive: true
    };
  } catch (error) {
    console.warn('Planetary Computer STAC query fallback:', error);
    return null;
  }
};

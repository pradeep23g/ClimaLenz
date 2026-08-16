const BRIDGE_BASE_URL = process.env.NEXT_PUBLIC_BRIDGE_API_URL || 'http://localhost:8000';

/**
 * Calls the Bridge CoLocation Assessment API.
 * 
 * @param {Object} payload 
 * @param {Object} payload.spatial_geometry - GeoJSON Polygon (the canonical AOI)
 * @param {string} payload.intervention_type - e.g. "tree_canopy", "white_roof"
 * @param {number} payload.delta - the magnitude of the intervention (e.g. 25.0)
 * @param {number} payload.cloud_tolerance_pct - max cloud tolerance (e.g. 20.0)
 * @returns {Promise<Object>} The API response
 */
export async function assessColocation(payload) {
  const url = `${BRIDGE_BASE_URL}/v1/colocation/assess`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.detail || JSON.stringify(errorBody);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(`CoLocation API Error (${response.status}): ${errorDetail}`);
  }

  return response.json();
}

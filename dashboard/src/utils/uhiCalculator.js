/**
 * Urban Heat Island (UHI) Calculation & Mitigation Science Engine
 * Computes severity indices, cooling strategy simulation physics, and SDG 11 recommendations.
 */

export const SEVERITY_LEVELS = {
  NORMAL: { name: 'Normal', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', desc: 'No significant urban heat island effect.' },
  MILD: { name: 'Mild UHI', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', desc: 'Localized thermal elevation (1-2°C above rural baseline).' },
  MODERATE: { name: 'Moderate UHI', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', desc: 'Noticeable urban heat trapping (2-4°C elevation).' },
  SEVERE: { name: 'Severe UHI', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', desc: 'Extreme thermal risk (>4°C elevation above rural baseline).' }
};

/**
 * Classifies Land Surface Temperature into UHI Severity Category
 */
export const classifySeverity = (lstTemp) => {
  if (lstTemp < 30.0) return SEVERITY_LEVELS.NORMAL;
  if (lstTemp < 34.0) return SEVERITY_LEVELS.MILD;
  if (lstTemp < 37.5) return SEVERITY_LEVELS.MODERATE;
  return SEVERITY_LEVELS.SEVERE;
};

/**
 * Cooling Strategy Impact Simulator Physics Model
 * Predicts thermal reduction based on green canopy extension, cool pavements, and water retention.
 * @param {number} currentLst - Baseline LST in °C
 * @param {number} vegPct - Planned Vegetation Increase (0 - 50%)
 * @param {number} coolPct - Cool Roof & Reflective Pavement Coverage (0 - 50%)
 * @param {number} waterPct - Water Bodies & Bioswale Retention (0 - 30%)
 */
export const calculateCoolingSimulation = (currentLst, vegPct = 0, coolPct = 0, waterPct = 0) => {
  // Empirical cooling factors based on urban climatology models (Oke et al., 2017):
  // 10% increase in vegetation canopy reduces ambient surface temp by ~0.85°C
  // 10% increase in high-albedo cool roofs/pavements reduces LST by ~0.55°C
  // 10% increase in water body retention reduces LST by ~0.70°C
  
  const vegCooling = (vegPct / 10) * 0.85;
  const coolPavementCooling = (coolPct / 10) * 0.55;
  const waterCooling = (waterPct / 10) * 0.70;
  
  const totalTempDrop = parseFloat((vegCooling + coolPavementCooling + waterCooling).toFixed(2));
  const projectedLst = parseFloat(Math.max(22.0, currentLst - totalTempDrop).toFixed(2));
  const energySavingsPct = parseFloat((totalTempDrop * 3.8).toFixed(1)); // ~3.8% HVAC energy reduction per 1°C ambient drop
  const co2MitigationTons = Math.round(totalTempDrop * 145); // estimated annual tons per sq km
  
  const projectedSeverity = classifySeverity(projectedLst);
  
  return {
    originalLst: currentLst,
    projectedLst,
    tempDrop: totalTempDrop,
    energySavingsPct,
    co2MitigationTons,
    projectedSeverity
  };
};

/**
 * Generates automated SDG 11 Climate Adaptation Recommendations based on zone metrics
 */
export const getSdg11Recommendations = (ndvi, builtup, lst) => {
  const recommendations = [];

  if (ndvi < 0.20) {
    recommendations.push({
      category: 'Urban Canopy Expansion (SDG 11.7)',
      impact: 'High Impact (-1.8°C)',
      description: 'Vegetation canopy is dangerously low (<0.20). Implement mandatory street tree planting and urban pocket parks to enhance evapotranspiration cooling.'
    });
  }

  if (builtup > 75) {
    recommendations.push({
      category: 'Cool Roofs & Permeable Pavements (SDG 11.B)',
      impact: 'Medium-High Impact (-1.2°C)',
      description: 'High built-up density (>75%). Retrofit commercial and industrial rooftops with high-albedo white coatings (albedo > 0.70) and permeable interlocking pavers.'
    });
  }

  if (lst >= 36.0) {
    recommendations.push({
      category: 'Micro-Climate Refuges & Shading Structures (SDG 11.5)',
      impact: 'Immediate Heat Risk Mitigation',
      description: 'Severe surface temperature detected. Establish public cooling centers, solar shade canopy structures, and misting corridors for high pedestrian traffic.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: 'Sustainable Urban Maintenance (SDG 11.3)',
      impact: 'Buffer Protection',
      description: 'Zone displays healthy thermal equilibrium. Maintain existing green infrastructure and monitor seasonal NDVI fluctuations.'
    });
  }

  return recommendations;
};

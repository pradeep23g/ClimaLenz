/**
 * Export Helpers Module
 * Downloads CSV spreadsheets and generates PDF summary reports.
 */
import { jsPDF } from 'jspdf';

/**
 * Export zone climate and thermal metrics to CSV format
 */
export const exportToCsv = (cityName, activeZone, simulation, recommendations) => {
  const zoneName = activeZone ? activeZone.name : `${cityName} General Region`;
  const lst = activeZone ? activeZone.lst : simulation.originalLst;
  const ndvi = activeZone ? activeZone.ndvi : 0.22;
  const builtup = activeZone ? activeZone.builtup : 80;
  
  let csvContent = `data:text/csv;charset=utf-8,`;
  csvContent += `URBAN HEAT ISLAND (UHI) MONITORING DASHBOARD - CLIMATE REPORT\n`;
  csvContent += `Generated Date,${new Date().toLocaleString()}\n`;
  csvContent += `Target Alignment,SDG 11 - Sustainable Cities and Communities\n\n`;

  csvContent += `LOCATION METRICS\n`;
  csvContent += `City,${cityName}\n`;
  csvContent += `Zone Analyzed,${zoneName}\n`;
  csvContent += `Land Surface Temperature (LST °C),${lst}\n`;
  csvContent += `NDVI Greenery Index,${ndvi}\n`;
  csvContent += `Urban Built-Up Density (%),${builtup}%\n`;
  csvContent += `Heat Severity Index,${simulation.projectedSeverity?.name || 'Moderate UHI'}\n\n`;

  csvContent += `COOLING SIMULATION MODEL\n`;
  csvContent += `Simulated Vegetation Increase (%),${simulation.vegPct || 0}%\n`;
  csvContent += `Cool Pavement / Roof Coverage (%),${simulation.coolPct || 0}%\n`;
  csvContent += `Water Retention Bodies (%),${simulation.waterPct || 0}%\n`;
  csvContent += `Projected Temperature Drop (°C),-${simulation.tempDrop}°C\n`;
  csvContent += `Projected LST (°C),${simulation.projectedLst}°C\n`;
  csvContent += `Estimated HVAC Energy Savings,${simulation.energySavingsPct}%\n`;
  csvContent += `Annual CO2 Mitigation (Tons/sq km),${simulation.co2MitigationTons}\n\n`;

  csvContent += `SDG 11 ACTIONABLE RECOMMENDATIONS\n`;
  recommendations.forEach((rec, idx) => {
    csvContent += `${idx + 1}. [${rec.category}] ${rec.impact} - "${rec.description.replace(/,/g, ';')}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `UHI_Climate_Report_${cityName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate formatted PDF Summary Report using jsPDF
 */
export const exportToPdf = (cityName, activeZone, simulation, recommendations, currentMetrics) => {
  const doc = new jsPDF();
  const zoneName = activeZone ? activeZone.name : `${cityName} Urban Agglomeration`;
  const lst = activeZone ? activeZone.lst : (currentMetrics?.lst || 36.5);
  const ndvi = activeZone ? activeZone.ndvi : (currentMetrics?.ndvi || 0.22);
  const builtup = activeZone ? activeZone.builtup : (currentMetrics?.builtup || 80);

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark slate slate-900
  doc.rect(0, 0, 210, 38, 'F');
  
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('URBAN HEAT ISLAND (UHI) MONITORING REPORT', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248); // Sky blue
  doc.text('Target Alignment: UN SDG 11 - Sustainable Cities & Climate Adaptation', 14, 28);
  
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 28);

  // Section 1: Executive Summary & Zone Metrics
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Executive Summary: ${cityName} (${zoneName})`, 14, 48);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 53, 182, 38, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Land Surface Temp (LST): `, 20, 63);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(225, 29, 72);
  doc.text(`${lst} °C`, 70, 63);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Vegetation Canopy (NDVI): `, 20, 72);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`${ndvi}`, 70, 72);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Built-Up Concrete Density: `, 20, 81);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${builtup}%`, 70, 81);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`UHI Severity Index: `, 115, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`${simulation.projectedSeverity?.name || 'Severe UHI'}`, 155, 63);

  doc.setFont('helvetica', 'bold');
  doc.text(`Ambient Air Temperature: `, 115, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(`${currentMetrics?.ambientTemp || 31.5} °C`, 162, 72);

  // Section 2: Cooling Simulator Forecast
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Cooling Strategy Simulation & Projected Impact`, 14, 104);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, 109, 182, 42, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(`Target Temperature Reduction: -${simulation.tempDrop} °C`, 20, 119);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`• Projected Surface Temp: ${simulation.projectedLst} °C (Reduced from ${lst} °C)`, 20, 128);
  doc.text(`• Estimated Building HVAC Energy Savings: ${simulation.energySavingsPct}% reduction`, 20, 136);
  doc.text(`• Annual Urban Carbon Footprint Mitigation: ~${simulation.co2MitigationTons} tons CO2/sq km`, 20, 144);

  // Section 3: Actionable SDG 11 Recommendations
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Actionable SDG 11 Urban Planning Interventions`, 14, 162);

  let yPos = 170;
  recommendations.forEach((rec, idx) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144);
    doc.text(`${idx + 1}. ${rec.category} [${rec.impact}]`, 14, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(rec.description, 180);
    doc.text(splitText, 14, yPos + 6);
    yPos += 8 + (splitText.length * 5);
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Urban Heat Island Monitoring Dashboard | Powered by NASA, Planetary Computer & Open-Meteo Pipelines', 14, 285);

  doc.save(`UHI_Climate_Report_${cityName.replace(/\s+/g, '_')}.pdf`);
};

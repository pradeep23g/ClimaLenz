"use client";

/**
 * App Component
 * Climalenz Web Application
 * High-Density Dark GIS Climate Analytics Platform (AquaLens AI Architecture)
 */
import React, { useState } from 'react';
import { useClimalenzData } from './hooks/useClimalenzData';
import { Homepage } from './components/Homepage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightConfigPanel } from './components/RightConfigPanel';
import { SatelliteNoticeBar } from './components/SatelliteNoticeBar';
import { MapLibreView } from './components/MapLibreView';
import { assessColocation } from './services/api/bridgeClient';

// Engine Views
import { WaterEngineDashboard } from './components/views/WaterEngineDashboard';
import { HeatEngineDashboard } from './components/views/HeatEngineDashboard';
import { ContinuityEngineDashboard } from './components/views/ContinuityEngineDashboard';
import { BridgeView } from './components/views/BridgeView';
import { AgentsView } from './components/views/AgentsView';
import { OverviewDashboard } from './components/views/OverviewDashboard';
import { AlertsView } from './components/views/AlertsView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  // Navigation State: 'homepage' | 'dashboard'
  const [viewMode, setViewMode] = useState('dashboard');

  const {
    selectedCityId,
    setSelectedCityId,
    currentCity,
    setCurrentCityOverride,
    presetCities,
    activeEngine,
    setActiveEngine,
    selectedSatellite,
    setSelectedSatellite,
    satelliteSources,
    coefficients,
    handleCoefficientChange,
    isLiveSyncing,
    triggerBackendSync,
    livePredictions,
    pipelineStatus,
    agentLogs,
    colocationState,
    setColocationState,
    colocationResult,
    setColocationResult,
    colocationError,
    setColocationError,
    intervention,
    setIntervention
  } = useClimalenzData('mumbai');

  const [activeZone, setActiveZone] = useState(null);
  const [isConfigPanelCollapsed, setIsConfigPanelCollapsed] = useState(false);

  // If viewMode is 'homepage', render the Landing Homepage first (Image 3 reference)
  if (viewMode === 'homepage') {
    return <Homepage onStartMonitoring={() => setViewMode('dashboard')} />;
  }

  const runColocation = async () => {
    setColocationState('ANALYZING');
    setColocationError(null);
    try {
      let spatial_geometry = null;
      if (activeZone && activeZone.coords) {
        const coords = [...activeZone.coords, activeZone.coords[0]];
        const geojsonCoords = coords.map(pt => [pt[1], pt[0]]);
        spatial_geometry = { type: "Polygon", coordinates: [geojsonCoords] };
      } else {
        const latDelta = 0.025;
        const lngDelta = 0.035;
        const lat = currentCity.lat;
        const lng = currentCity.lng;
        const geojsonCoords = [
          [lng - lngDelta, lat - latDelta],
          [lng + lngDelta, lat - latDelta],
          [lng + lngDelta, lat + latDelta],
          [lng - lngDelta, lat + latDelta],
          [lng - lngDelta, lat - latDelta]
        ];
        spatial_geometry = { type: "Polygon", coordinates: [geojsonCoords] };
      }

      const payload = {
        spatial_geometry,
        intervention_type: intervention.type.toUpperCase(),
        delta: intervention.delta / 100.0,
        cloud_tolerance_pct: intervention.cloudTolerance || 30.0
      };

      const result = await assessColocation(payload);
      setColocationResult(result);
      setColocationState('SUCCESS');
    } catch (err) {
      setColocationError(err.message);
      setColocationState('ERROR');
    }
  };

  // Render appropriate central engine view based on sidebar selection
  const renderMainView = () => {
    switch (activeEngine) {
      case 'water':
        return (
          <WaterEngineDashboard
            currentCity={currentCity}
            onLocationChange={setCurrentCityOverride}
            activeEngine={activeEngine}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
            livePredictions={livePredictions}
            coefficients={coefficients}
            selectedSatellite={selectedSatellite}
            colocationResult={colocationResult}
            colocationState={colocationState}
          />
        );
      case 'heat':
        return (
          <HeatEngineDashboard
            currentCity={currentCity}
            onLocationChange={setCurrentCityOverride}
            activeEngine={activeEngine}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
            livePredictions={livePredictions}
            colocationResult={colocationResult}
            colocationState={colocationState}
          />
        );
      case 'continuity':
        return (
          <ContinuityEngineDashboard
            currentCity={currentCity}
            onLocationChange={setCurrentCityOverride}
            activeEngine={activeEngine}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
            livePredictions={livePredictions}
            colocationResult={colocationResult}
            colocationState={colocationState}
          />
        );
      case 'bridge':
        return (
          <BridgeView
            pipelineStatus={pipelineStatus}
            onTriggerSync={triggerBackendSync}
            isSyncing={isLiveSyncing}
          />
        );
      case 'agents':
        return (
          <AgentsView
            agentLogs={agentLogs}
            currentCity={currentCity}
          />
        );
      case 'map_view':
        return (
          <div className="flex-1 p-4 bg-[#060911] h-full flex flex-col space-y-3">
            <h1 className="text-xl font-black text-slate-100">Full-Screen GIS Map Canvas</h1>
            <div className="flex-1 min-h-[500px]">
              <MapLibreView
                city={currentCity}
                onLocationChange={setCurrentCityOverride}
                activeEngine="overview"
                activeZone={activeZone}
                onSelectZone={setActiveZone}
                livePredictions={livePredictions}
                satelliteFeedNotice={selectedSatellite}
                colocationResult={colocationResult}
              />
            </div>
          </div>
        );
      case 'alerts':
        return <AlertsView currentCity={currentCity} />;
      case 'settings':
        return (
          <SettingsView
            selectedSatellite={selectedSatellite}
            setSelectedSatellite={setSelectedSatellite}
            satelliteSources={satelliteSources}
          />
        );
      case 'overview':
      default:
        return (
          <OverviewDashboard
            currentCity={currentCity}
            onLocationChange={setCurrentCityOverride}
            activeEngine={activeEngine}
            setActiveEngine={setActiveEngine}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
            livePredictions={livePredictions}
            pipelineStatus={pipelineStatus}
            selectedSatellite={selectedSatellite}
            colocationResult={colocationResult}
            colocationState={colocationState}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060911] text-slate-100 font-sans antialiased overflow-hidden select-none">
      
      {/* Top Header Navigation */}
      <Navbar
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
        presetCities={presetCities}
        onRefresh={triggerBackendSync}
        isSyncing={isLiveSyncing}
        activeEngine={activeEngine}
        setActiveEngine={setActiveEngine}
        onGoHome={() => window.location.href = '/'}
      />

      {/* Main Workspace Layout (Left Sidebar + Center Canvas + Right Config Panel) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeEngine={activeEngine}
          setActiveEngine={setActiveEngine}
        />

        {/* Central Workspace Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#060911]">
          {colocationResult?.execution_mode === 'CACHED' && (
            <div className="bg-amber-900/40 border-b border-amber-500/50 px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-amber-300 font-bold tracking-wider text-xs uppercase">
                Live Computation Failed. Displaying Last-Known-Good Snapshot ({new Date(colocationResult.computed_at).toLocaleString()})
              </span>
            </div>
          )}
          {colocationResult?.critic_audit?.verdict === 'FAIL' && colocationResult?.execution_mode !== 'CACHED' && (
            <div className="bg-rose-900/40 border-b border-rose-500/50 px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-300 font-bold tracking-wider text-xs uppercase">
                Critic Agent Warning: Narrative Validation Failed
              </span>
            </div>
          )}
          {renderMainView()}
        </main>

        {/* Right Configuration Side Panel */}
        <RightConfigPanel
          activeEngine={activeEngine}
          selectedSatellite={selectedSatellite}
          setSelectedSatellite={setSelectedSatellite}
          satelliteSources={satelliteSources}
          coefficients={coefficients}
          handleCoefficientChange={handleCoefficientChange}
          isCollapsed={isConfigPanelCollapsed}
          onToggleCollapse={() => setIsConfigPanelCollapsed((collapsed) => !collapsed)}
          colocationState={colocationState}
          colocationError={colocationError}
          intervention={intervention}
          setIntervention={setIntervention}
          runColocation={runColocation}
        />

      </div>

      {/* Fixed Bottom Satellite Data Notice Bar */}
      <SatelliteNoticeBar 
        selectedSatellite={selectedSatellite} 
        colocationResult={colocationResult}
        colocationState={colocationState}
      />

    </div>
  );
}

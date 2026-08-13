/**
 * App Component
 * Climalenz Web Application - Panimalar Hackathon Edition
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
  const [viewMode, setViewMode] = useState('homepage');

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
    agentLogs
  } = useClimalenzData('mumbai');

  const [activeZone, setActiveZone] = useState(null);

  // If viewMode is 'homepage', render the Landing Homepage first (Image 3 reference)
  if (viewMode === 'homepage') {
    return <Homepage onStartMonitoring={() => setViewMode('dashboard')} />;
  }

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
        onGoHome={() => setViewMode('homepage')}
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
        />

      </div>

      {/* Fixed Bottom Satellite Data Notice Bar */}
      <SatelliteNoticeBar selectedSatellite={selectedSatellite} />

    </div>
  );
}

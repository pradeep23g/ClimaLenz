"use client";

import React, { useState } from 'react';
import { Homepage } from './components/Homepage';
import { MissionControlLayout } from './components/MissionControlLayout';
import { MapLibreView } from './components/MapLibreView';
import { CommandBar } from './components/CommandBar';
import ExecutiveHUD from './components/hud/ExecutiveHUD';
import { ScienceDrawer } from './components/drawers/ScienceDrawer';
import { AgentsView } from './components/views/AgentsView';
import { Sidebar } from './components/navigation/Sidebar';
import { useMissionControl } from './hooks/useMissionControl';

const DEFAULT_CITY = {
  id: 'mumbai',
  name: 'Mumbai',
  lat: 19.0760,
  lng: 72.8777,
  zoom: 12
};

export default function App() {
  const [viewMode, setViewMode] = useState('homepage');
  const [currentView, setCurrentView] = useState('monitor'); // 'monitor' or 'copilot'
  const missionControl = useMissionControl();

  if (viewMode === 'homepage') {
    return <Homepage onStartMonitoring={() => setViewMode('dashboard')} />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#060911] text-slate-100 font-sans antialiased overflow-hidden select-none">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <MissionControlLayout>
        {currentView === 'monitor' && (
          <>
            <CommandBar missionControl={missionControl} />
            <MapLibreView 
              city={DEFAULT_CITY}
              missionControl={missionControl}
            />
            <ExecutiveHUD missionControl={missionControl} />
            <ScienceDrawer missionControl={missionControl} />
          </>
        )}
        
        {currentView === 'copilot' && (
          <AgentsView 
            missionControl={missionControl} 
            currentCity={DEFAULT_CITY} 
          />
        )}
      </MissionControlLayout>
    </div>
  );
}


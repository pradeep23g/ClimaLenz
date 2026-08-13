/**
 * MapView Component
 * Interactive Leaflet GIS Map matching AquaLens AI design with dark basemap,
 * live backend sync overlay, floating prediction stats, street layer toggle, and custom AOI polygon controls.
 */
import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Polygon, 
  Popup, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getLstColor, getNdviColor } from '../utils/geojsonHelpers';
import { RefreshCw, Plus, Minus, Layers, CheckCircle2 } from 'lucide-react';

const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

const MapDrawListener = ({ isDrawingMode, onAddDrawPoint }) => {
  useMapEvents({
    click(e) {
      if (isDrawingMode) {
        onAddDrawPoint([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
};

export const MapView = ({ 
  city, 
  activeEngine = 'water', 
  activeZone, 
  onSelectZone, 
  isDrawingMode,
  customPolygon,
  onAddDrawPoint,
  onClearCustomPolygon,
  livePredictions
}) => {
  const center = [city.lat, city.lng];
  const zoom = city.zoom || 12;
  const [basemapStyle, setBasemapStyle] = useState('dark'); // 'dark' | 'street'

  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const streetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const predictedRunoff = livePredictions?.predictedRunoff || 1.35;
  const soilMoisture = livePredictions?.soilMoisture || 32;
  const evapotranspiration = livePredictions?.evapotranspiration || 4.1;
  const catchment = livePredictions?.catchmentLevel || 75;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16] select-none min-h-[380px]">
      
      {/* Top Left Floating Map Popup Stats (AquaLens style) */}
      <div className="absolute top-3 left-3 z-[1000] px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-md space-y-1 text-xs font-mono">
        <div className="flex items-center justify-between gap-3 text-slate-300 font-bold">
          <span>Predicted Runoff</span>
        </div>
        <div className="text-slate-300">Soil Moisture: <span className="text-cyan-400 font-bold">{soilMoisture}%</span></div>
        <div className="text-slate-300">Soil Moisture (%): <span className="text-emerald-400 font-bold">{catchment}%</span></div>
      </div>

      {/* Top Right Floating Sync with Backend Panel */}
      <div className="absolute top-3 right-3 z-[1000] px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-md text-xs space-y-1.5 w-52">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <span className="font-bold text-[11px] text-slate-200 flex items-center gap-1.5">
            Sync with Backend
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          Recent updates with Dharshan
        </div>
        <div className="space-y-1 pt-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Water Engine
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Status <CheckCircle2 className="w-3 h-3" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Heat Engine
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Status <CheckCircle2 className="w-3 h-3" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Continuity Engine
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Status <CheckCircle2 className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Left Basemap Toggle (Street / Dark) */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <button
          onClick={() => setBasemapStyle(prev => prev === 'dark' ? 'street' : 'dark')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-semibold shadow-xl hover:bg-slate-800 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{basemapStyle === 'dark' ? 'Street' : 'Dark Basemap'}</span>
        </button>
      </div>

      {/* Bottom Right Floating Map Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] px-3.5 py-2.5 rounded-xl bg-[#090d16]/90 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-md text-[11px] space-y-1.5">
        <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
          Predicted Runoff
        </div>
        <div className="space-y-1 text-[10px] font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cyan-500/80 border border-cyan-400" />
            <span>Predicted Runoff &gt;=</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400" />
            <span>Soil Moisture (%): &gt;=</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400" />
            <span>Catchment Level: %</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-indigo-500/80 border border-indigo-400" />
            <span>Evapotranspiration {evapotranspiration}mm</span>
          </div>
        </div>
        <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-500">
          © OpenStreetMap contributors @ CARTO
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
      >
        <MapRecenter center={center} zoom={zoom} />
        <MapDrawListener isDrawingMode={isDrawingMode} onAddDrawPoint={onAddDrawPoint} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={basemapStyle === 'dark' ? darkTileUrl : streetTileUrl}
        />

        {/* GIS Grid Points Overlay */}
        {city.thermalGrid && city.thermalGrid.map((pt, idx) => {
          let fillColor = getLstColor(pt.lst);
          let radius = 16;
          let opacity = 0.55;

          if (activeEngine === 'water') {
            fillColor = pt.lst > 38 ? '#06b6d4' : pt.lst > 34 ? '#3b82f6' : '#10b981';
          } else if (activeEngine === 'continuity') {
            fillColor = pt.ndvi > 0.4 ? '#10b981' : '#f59e0b';
          }

          return (
            <CircleMarker
              key={idx}
              center={[pt.lat, pt.lng]}
              radius={radius}
              pathOptions={{
                fillColor: fillColor,
                fillOpacity: opacity,
                stroke: false
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900 text-xs">
                  <div className="font-bold text-sm mb-1">GIS Grid Point</div>
                  <div><strong>LST Temperature:</strong> {pt.lst} °C</div>
                  <div><strong>Soil Moisture:</strong> {soilMoisture}%</div>
                  <div><strong>Evapotranspiration:</strong> {evapotranspiration}mm</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Predefined Microclimate Zones Polygons */}
        {city.zones && city.zones.map((zone) => {
          const isSelected = activeZone?.id === zone.id;
          return (
            <Polygon
              key={zone.id}
              positions={zone.coords}
              pathOptions={{
                color: isSelected ? '#38bdf8' : '#06b6d4',
                weight: isSelected ? 3 : 1.5,
                fillColor: '#0284c7',
                fillOpacity: isSelected ? 0.45 : 0.25,
                dashArray: isSelected ? '6, 6' : undefined
              }}
              eventHandlers={{
                click: () => onSelectZone(zone)
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900 text-xs max-w-xs">
                  <div className="font-bold text-sm text-slate-900 mb-1">{zone.name}</div>
                  <div><strong>Soil Moisture:</strong> {zone.soilMoisture}%</div>
                  <div><strong>Evapotranspiration:</strong> {zone.evapotranspiration}mm</div>
                  <div><strong>Catchment Level:</strong> {zone.catchment}%</div>
                  <div className="mt-1 text-[11px] font-medium text-slate-700 bg-cyan-50 p-1.5 rounded border border-cyan-200">
                    💡 {zone.recommendation}
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* User Custom Drawn Bounding Polygon */}
        {customPolygon && customPolygon.length > 2 && (
          <Polygon
            positions={customPolygon}
            pathOptions={{
              color: '#06b6d4',
              weight: 3,
              fillColor: '#22d3ee',
              fillOpacity: 0.35,
              dashArray: '4, 4'
            }}
          />
        )}

      </MapContainer>
    </div>
  );
};

/**
 * MapLibreView Component
 * High-Density Dark GIS Map built with MapLibre GL JS.
 * Replaces old circular red dots with smooth vector tiles, smooth microclimate polygons,
 * floating AOI buffer card, location search bar (Nominatim geocoding), and basemap toggles.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, NavigationControl, Marker } from 'maplibre-gl';
import { Search, MapPin, Layers, Check, X } from 'lucide-react';

export const MapLibreView = ({
  city,
  onLocationChange,
  activeEngine = 'water',
  activeZone,
  onSelectZone,
  livePredictions,
  satelliteFeedNotice,
  colocationResult,
  showLayerControls = false
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [basemapStyle, setBasemapStyle] = useState('dark'); // 'dark' | 'street'
  const [currentCoords, setCurrentCoords] = useState({ lat: city.lat, lng: city.lng, name: city.name });
  const [visibleLayers, setVisibleLayers] = useState({ heat: true, water: true, canopy: true });

  const darkStyleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
  const streetStyleUrl = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  // Initialize MapLibre GL map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: basemapStyle === 'dark' ? darkStyleUrl : streetStyleUrl,
      center: [currentCoords.lng, currentCoords.lat],
      zoom: city.zoom || 12,
      pitch: 30,
      bearing: 0
    });

    mapRef.current = map;

    // Add navigation control
    map.addControl(new NavigationControl({ showCompass: true, showZoom: false }), 'top-right');

    map.on('load', () => {
      // Remove mock thermal grid. Real visualization will be handled dynamically via useEffect when colocationResult arrives.

      // Add AOI Bounding Box Layer (Matching Image 2 Reference)
      const latDelta = 0.025;
      const lngDelta = 0.035;
      const bboxCoords = [
        [currentCoords.lng - lngDelta, currentCoords.lat - latDelta],
        [currentCoords.lng + lngDelta, currentCoords.lat - latDelta],
        [currentCoords.lng + lngDelta, currentCoords.lat + latDelta],
        [currentCoords.lng - lngDelta, currentCoords.lat + latDelta],
        [currentCoords.lng - lngDelta, currentCoords.lat - latDelta]
      ];

      map.addSource('aoi-bbox-src', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [bboxCoords] }
        }
      });

      // AOI Outline
      map.addLayer({
        id: 'aoi-bbox-stroke',
        type: 'line',
        source: 'aoi-bbox-src',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      // AOI Fill
      map.addLayer({
        id: 'aoi-bbox-fill',
        type: 'fill',
        source: 'aoi-bbox-src',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.12
        }
      });

      // Marker for central location pin
      const markerEl = document.createElement('div');
      markerEl.style.cssText = 'width:28px;height:28px;border-radius:50%;background:rgba(6,182,212,0.25);border:2px solid #22d3ee;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px rgba(6,182,212,0.4);';
      markerEl.innerHTML = '📍';
      new Marker({ element: markerEl })
        .setLngLat([currentCoords.lng, currentCoords.lat])
        .addTo(map);

      map.resize();
    });

    return () => {
      map.remove();
    };
  }, [basemapStyle, city.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyVisibility = () => {
      if (map.getLayer('real-thermal-heatmap-layer')) {
        map.setLayoutProperty('real-thermal-heatmap-layer', 'visibility', visibleLayers.heat ? 'visible' : 'none');
      }
    };
    if (map.isStyleLoaded()) applyVisibility();
    else map.once('load', applyVisibility);
  }, [visibleLayers, basemapStyle, city.id]);

  // Handle dynamic real visualization from backend
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (colocationResult?.heat_visualization_base64) {
      const b64Data = colocationResult.heat_visualization_base64;
      const imageUrl = `data:image/png;base64,${b64Data}`;

      const latDelta = 0.025;
      const lngDelta = 0.035;
      const overlayCoords = [
        [currentCoords.lng - lngDelta, currentCoords.lat + latDelta], // top left
        [currentCoords.lng + lngDelta, currentCoords.lat + latDelta], // top right
        [currentCoords.lng + lngDelta, currentCoords.lat - latDelta], // bottom right
        [currentCoords.lng - lngDelta, currentCoords.lat - latDelta]  // bottom left
      ];

      if (map.getSource('real-thermal-heatmap-src')) {
        map.getSource('real-thermal-heatmap-src').updateImage({ url: imageUrl, coordinates: overlayCoords });
      } else {
        map.addSource('real-thermal-heatmap-src', {
          type: 'image',
          url: imageUrl,
          coordinates: overlayCoords
        });
        map.addLayer({
          id: 'real-thermal-heatmap-layer',
          type: 'raster',
          source: 'real-thermal-heatmap-src',
          paint: {
            'raster-opacity': 0.8,
            'raster-fade-duration': 300
          }
        }, 'aoi-bbox-stroke'); // Place just below the AOI bbox outline
      }
    } else {
      if (map.getLayer('real-thermal-heatmap-layer')) {
        map.removeLayer('real-thermal-heatmap-layer');
      }
      if (map.getSource('real-thermal-heatmap-src')) {
        map.removeSource('real-thermal-heatmap-src');
      }
    }
  }, [colocationResult, currentCoords]);

  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update map center when city changes
  useEffect(() => {
    setCurrentCoords({ lat: city.lat, lng: city.lng, name: city.name });
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [city.lng, city.lat],
        zoom: city.zoom || 12,
        speed: 1.2
      });
    }
  }, [city]);

  // Handle Location Search (Nominatim Geocoding API)
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const results = await res.json();

      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        const name = first.display_name.split(',')[0];

        setCurrentCoords({ lat, lng, name });

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 12,
            speed: 1.4
          });
        }

        if (onLocationChange) {
          onLocationChange({ id: 'custom', name, lat, lng, zoom: 12, country: 'Search Result' });
        }
      } else {
        setSearchError('Location not found. Try another city.');
      }
    } catch (err) {
      setSearchError('Geocoding search failed. Check network connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const soilMoisture = livePredictions?.soilMoisture || 32;
  const catchment = livePredictions?.catchmentLevel || 75;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16] select-none min-h-[420px]">
      
      {/* Top Map Bar: Location Search Bar & Quick Switcher */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        
        {/* Location Search Input (Search Bar directly on map) */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="pointer-events-auto w-full sm:w-80 relative flex items-center shadow-2xl"
        >
          <Search className="w-4 h-4 absolute left-3.5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search location on map (e.g. Chennai, London)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2 rounded-xl text-xs bg-[#090d16]/90 backdrop-blur-md border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-2xl"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase transition-all cursor-pointer"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {/* Top Left AOI Buffer Info Badge (AquaLens Image 2 Style) */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#090d16]/90 border border-slate-800 backdrop-blur-md text-xs font-mono shadow-2xl text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            AOI BUFFER: <strong className="text-cyan-300">{currentCoords.lat.toFixed(3)}°N · {currentCoords.lng.toFixed(3)}°E</strong> (~4.01 km²)
          </span>
        </div>

      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      {showLayerControls && (
        <div className="absolute right-3 top-16 z-20 flex flex-wrap justify-end gap-1.5">
          {[
            ['heat', 'Heat Hotspots', 'border-rose-400/50 bg-slate-950/90 text-rose-300'],
            ['water', 'Hydrologic Deficits', 'border-cyan-400/50 bg-slate-950/90 text-cyan-300'],
            ['canopy', 'Canopy Cover', 'border-emerald-400/50 bg-slate-950/90 text-emerald-300'],
          ].map(([key, label, activeClass]) => (
            <button
              key={key}
              type="button"
              onClick={() => setVisibleLayers((current) => ({ ...current, [key]: !current[key] }))}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold shadow-xl backdrop-blur-md transition ${visibleLayers[key] ? activeClass : 'border-slate-700 bg-slate-950/80 text-slate-500'}`}
            >
              {visibleLayers[key] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {label}
            </button>
          ))}
        </div>
      )}

      {/* Search Error Alert */}
      {searchError && (
        <div className="absolute top-16 left-3 z-30 px-3 py-1.5 rounded-lg bg-rose-950/90 border border-rose-600 text-rose-300 text-xs font-medium backdrop-blur-md">
          ⚠️ {searchError}
        </div>
      )}

      {/* Bottom Left Basemap Toggle Pill */}
      <div className="absolute bottom-3 left-3 z-20">
        <button
          onClick={() => setBasemapStyle(s => s === 'dark' ? 'street' : 'dark')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#090d16]/90 border border-slate-700 text-slate-200 text-xs font-semibold shadow-2xl hover:bg-slate-800 backdrop-blur-md cursor-pointer transition-all"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{basemapStyle === 'dark' ? 'Street Basemap' : 'Dark Basemap'}</span>
        </button>
      </div>

      {/* Bottom Right Floating Map Legend */}
      <div className="absolute bottom-3 right-3 z-20 px-3.5 py-2 rounded-xl bg-[#090d16]/90 border border-slate-800 text-slate-200 shadow-2xl backdrop-blur-md text-[11px] space-y-1">
        <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
          Thermal & Hydrologic Legend
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Thermal Anomaly</span>
          </div>
        </div>
      </div>

    </div>
  );
};

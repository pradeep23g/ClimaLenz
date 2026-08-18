/**
 * MapLibreView Component
 * High-Density Dark GIS Map built with MapLibre GL JS.
 * Renders verified spatial output from backend.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, NavigationControl, Marker } from 'maplibre-gl';
import { Layers, Check, X, MapPin } from 'lucide-react';

export const MapLibreView = ({
  city,
  missionControl,
  showLayerControls = false
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  const [basemapStyle, setBasemapStyle] = useState('dark');
  const [visibleLayers, setVisibleLayers] = useState({ heat: true });
  const [mapLoaded, setMapLoaded] = useState(false);

  const darkStyle = {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256
      }
    },
    layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }]
  };

  const streetStyle = {
    version: 8,
    sources: {
      'carto-light': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256
      }
    },
    layers: [{ id: 'carto-light-layer', type: 'raster', source: 'carto-light' }]
  };

  const { selectedLocation, report } = missionControl || {};

  // Determine current center point
  const mapCenterLng = selectedLocation?.center?.[0] || city?.lng || 0;
  const mapCenterLat = selectedLocation?.center?.[1] || city?.lat || 0;
  const aoiName = selectedLocation?.name || city?.name || 'Selected AOI';

  // Initialize MapLibre GL map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    setMapLoaded(false);

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: basemapStyle === 'dark' ? darkStyle : streetStyle,
      center: [mapCenterLng, mapCenterLat],
      zoom: city?.zoom || 12,
      pitch: 30,
      bearing: 0
    });

    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: true, showZoom: false }), 'top-right');

    map.on('load', () => {
      // Add empty source for AOI BBox
      map.addSource('aoi-bbox-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

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

      map.addLayer({
        id: 'aoi-bbox-fill',
        type: 'fill',
        source: 'aoi-bbox-src',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.12
        }
      });

      map.resize();
      setMapLoaded(true);
    });

    return () => {
      map.remove();
    };
  }, [basemapStyle]);

  // Handle Layer Visibility
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
  }, [visibleLayers, basemapStyle]);

  // Handle AOI Geometry update
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !selectedLocation) return;

    const geojsonData = {
      type: 'Feature',
      geometry: selectedLocation
    };

    if (map.getSource('aoi-bbox-src')) {
      map.getSource('aoi-bbox-src').setData(geojsonData);
    }
  }, [selectedLocation, basemapStyle, mapLoaded]);

  // Fly to new location
  useEffect(() => {
    if (mapRef.current && selectedLocation?.center) {
      mapRef.current.flyTo({
        center: selectedLocation.center,
        zoom: 12,
        speed: 1.2
      });
    }
  }, [selectedLocation?.center]);

  // Handle dynamic real visualization from backend
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (report?.heat_visualization_base64 && selectedLocation?.coordinates?.[0]) {
      const b64Data = report.heat_visualization_base64;
      const imageUrl = `data:image/png;base64,${b64Data}`;

      // Extract bounds from the polygon coordinates.
      // Polygon coords: [topLeft, topRight, bottomRight, bottomLeft]
      // Need [topLeft, topRight, bottomRight, bottomLeft] for Mapbox GL JS image overlay
      const coords = selectedLocation.coordinates[0];
      
      // Convert EPSG:4326 to Web Mercator (EPSG:3857) to prevent distortion
      const toMercator = (coord) => {
        const x = (coord[0] * 20037508.34) / 180;
        let y = Math.log(Math.tan(((90 + coord[1]) * Math.PI) / 360)) / (Math.PI / 180);
        y = (y * 20037508.34) / 180;
        return [x, y];
      };

      const overlayCoords = [
        toMercator(coords[3]), // top left
        toMercator(coords[2]), // top right
        toMercator(coords[1]), // bottom right
        toMercator(coords[0])  // bottom left
      ];

      // Wait, MapLibre image source needs [top-left, top-right, bottom-right, bottom-left].
      // The polygon created in CommandBar is:
      // [lng - lngDelta, lat - latDelta] -> bottom-left (0)
      // [lng + lngDelta, lat - latDelta] -> bottom-right (1)
      // [lng + lngDelta, lat + latDelta] -> top-right (2)
      // [lng - lngDelta, lat + latDelta] -> top-left (3)
      // [lng - lngDelta, lat - latDelta] -> bottom-left (4)
      // So overlay should be [coords[3], coords[2], coords[1], coords[0]]

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
  }, [report, selectedLocation, basemapStyle, mapLoaded]);

  // Resize observer
  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full bg-[#090d16] select-none flex flex-col">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full" />

      {/* State Overlay Message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center opacity-70">
        {!selectedLocation && missionControl?.status === 'IDLE' && (
          <span className="px-6 py-3 bg-black/60 text-slate-300 text-sm font-bold tracking-widest uppercase rounded-full backdrop-blur-sm border border-slate-700/50">
            Select Area of Interest
          </span>
        )}
        {missionControl?.status === 'LOADING' && (
          <span className="px-6 py-3 bg-cyan-900/40 text-cyan-400 text-sm font-bold tracking-widest uppercase rounded-full backdrop-blur-sm border border-cyan-500/30 flex items-center gap-3 shadow-lg shadow-cyan-900/20">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            Analyzing Local Climate...
          </span>
        )}
        {missionControl?.status === 'ERROR' && (
          <span className="px-6 py-3 bg-rose-900/40 text-rose-400 text-sm font-bold tracking-widest uppercase rounded-full backdrop-blur-sm border border-rose-500/30">
            Analysis Failed
          </span>
        )}
      </div>

      {/* Top Left AOI Buffer Info Badge */}
      {selectedLocation && (
        <div className="absolute top-20 left-3 z-20 pointer-events-auto hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#090d16]/90 border border-slate-800 backdrop-blur-md text-xs font-mono shadow-2xl text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            AOI BUFFER: <strong className="text-cyan-300">{aoiName}</strong>
          </span>
        </div>
      )}

      {showLayerControls && (
        <div className="absolute right-3 top-20 z-20 flex flex-wrap justify-end gap-1.5 pointer-events-auto">
          {[
            ['heat', 'Heat Hotspots', 'border-rose-400/50 bg-slate-950/90 text-rose-300'],
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

      {/* Bottom Left Basemap Toggle Pill */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
        <button
          onClick={() => setBasemapStyle(s => s === 'dark' ? 'street' : 'dark')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#090d16]/90 border border-slate-700 text-slate-200 text-xs font-semibold shadow-2xl hover:bg-slate-800 backdrop-blur-md cursor-pointer transition-all"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{basemapStyle === 'dark' ? 'Street Basemap' : 'Dark Basemap'}</span>
        </button>
      </div>

    </div>
  );
};

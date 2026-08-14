/**
 * Backwards-compatible map adapter. All dashboard maps are rendered with MapLibre.
 */
import React from 'react';
import { MapLibreView } from './MapLibreView';

export const MapView = ({
  city,
  activeEngine = 'water',
  activeZone,
  onSelectZone,
  livePredictions,
  onLocationChange,
}) => (
  <MapLibreView
    city={city}
    activeEngine={activeEngine}
    activeZone={activeZone}
    onSelectZone={onSelectZone}
    livePredictions={livePredictions}
    onLocationChange={onLocationChange}
  />
);

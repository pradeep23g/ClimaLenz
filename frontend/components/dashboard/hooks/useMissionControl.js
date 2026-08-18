import { useState, useCallback } from 'react';
import { assessColocation } from '../services/api/bridgeClient';

export function useMissionControl() {
  const [requestPayload, setRequestPayload] = useState(null);
  const [status, setStatus] = useState('IDLE');
  const [errorMessage, setErrorMessage] = useState(null);
  const [report, setReport] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState('CANOPY');
  const [selectedDelta, setSelectedDelta] = useState(0.15);

  const setLocation = useCallback((geom) => {
    setSelectedLocation(geom);
  }, []);

  const setIntervention = useCallback((type) => {
    setSelectedIntervention(type);
  }, []);

  const setDelta = useCallback((delta) => {
    setSelectedDelta(delta);
  }, []);

  const runAssessment = useCallback(async () => {
    if (!selectedLocation) {
      setErrorMessage('No location selected.');
      setStatus('ERROR');
      return;
    }
    
    setStatus('LOADING');
    setErrorMessage(null);

    const payload = {
      spatial_geometry: selectedLocation,
      intervention_type: selectedIntervention,
      delta: selectedDelta,
      lookback_days: 30,
      cloud_tolerance_pct: 30.0
    };

    setRequestPayload(payload);

    try {
      const result = await assessColocation(payload);
      setReport(result);
      setStatus('SUCCESS');
    } catch (err) {
      setErrorMessage(err.message || 'Assessment failed');
      setStatus('ERROR');
    }
  }, [selectedLocation, selectedIntervention, selectedDelta]);

  const resetAssessment = useCallback(() => {
    setStatus('IDLE');
    setErrorMessage(null);
    setReport(null);
    setRequestPayload(null);
  }, []);

  return {
    requestPayload,
    status,
    errorMessage,
    report,
    selectedLocation,
    selectedIntervention,
    selectedDelta,
    setLocation,
    setIntervention,
    setDelta,
    runAssessment,
    resetAssessment
  };
}

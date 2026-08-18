export const formatExecutionTruth = (report) => {
  if (!report) return null;

  const mode = report.execution_mode;
  const provenance = report.provenance;
  const dataStatus = report.data_status;

  // OVERRIDE: Even if mode is LIVE, if the optical data failed and we fell back
  // to a synthetic block, the overarching visual truth must be SYNTHETIC.
  if (provenance === 'synthetic_fallback' || mode === 'SYNTHETIC' || dataStatus === 'DEGRADED_SYNTHETIC') {
    return {
      label: 'SYNTHETIC',
      severity: 'error',
      description: 'System fell back to synthetic models. Proceed with caution.',
      mode,
      provenance
    };
  }

  if (mode === 'CACHED') {
    return {
      label: 'CACHED',
      severity: 'info',
      description: `Last known good snapshot. (${dataStatus})`,
      mode,
      provenance
    };
  }

  if (provenance === 'continuity_reconstructed') {
    return {
      label: 'RECONSTRUCTED',
      severity: 'warning',
      description: 'Optical data repaired using SAR/Continuity engine.',
      mode,
      provenance
    };
  }

  return {
    label: 'LIVE',
    severity: 'success',
    description: 'Current real-time observations.',
    mode,
    provenance
  };
};

export const formatHeatDelta = (summary) => {
  if (!summary || summary.min === undefined || summary.max === undefined) return 'N/A';
  return `${summary.min.toFixed(2)}°C → +${summary.max.toFixed(2)}°C`;
};

export const formatWaterScore = (score) => {
  if (score === undefined || score === null) return 'N/A';
  return parseFloat(score).toFixed(2);
};

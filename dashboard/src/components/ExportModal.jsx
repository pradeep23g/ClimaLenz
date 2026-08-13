/**
 * ExportModal Component
 * Popup modal for exporting CSV spreadsheets and PDF summary reports.
 */
import React from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Globe 
} from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';

export const ExportModal = ({ 
  isOpen, 
  onClose, 
  cityName, 
  activeZone, 
  simulation, 
  recommendations, 
  currentMetrics,
  isDarkMode 
}) => {
  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    exportToCsv(cityName, activeZone, simulation, recommendations);
  };

  const handleDownloadPdf = () => {
    exportToPdf(cityName, activeZone, simulation, recommendations, currentMetrics);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      
      <div className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isDarkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" /> Climate Data Exporter
          </div>
          <h3 className="text-lg font-bold">
            Export Urban Heat Island Report
          </h3>
          <p className="text-xs text-slate-400">
            Download comprehensive analysis for <strong className="text-slate-200">{cityName}</strong> ({activeZone ? activeZone.name : 'All Urban Zones'}).
          </p>
        </div>

        {/* Export Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* PDF Report Option */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 w-fit mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">PDF Executive Summary</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Formatted document including SDG 11 metrics, severity index, cooling simulation, and policy interventions.
              </p>
            </div>
            
            <button
              onClick={handleDownloadPdf}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/20"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF Report
            </button>
          </div>

          {/* CSV Spreadsheet Option */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 w-fit mb-2">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm">CSV Dataset (Raw)</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Structured spreadsheet data suitable for GIS analysis, Excel, or Python data science pipelines.
              </p>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV Spreadsheet
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2 border-t border-slate-800 pt-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Reports adhere to standard UN SDG 11 Climate Adaptation Documentation frameworks.</span>
        </div>

      </div>

    </div>
  );
};

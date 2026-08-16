/**
 * AgentsView Component
 * Vertex AI / Gemini Copilot Interface for automated insight synthesis & climate query handling.
 */
import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  BrainCircuit,
  MessageSquare
} from 'lucide-react';

export const AgentsView = ({ agentLogs, currentCity }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your Climalenz Vertex AI Climate Assistant. I am monitoring live feeds across Water, Heat, and Continuity engines for ${currentCity.name}. How can I assist your climate research today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const quickPrompts = [
    `Generate Water Catchment Report for ${currentCity.name}`,
    `Analyze LST anomaly in ${currentCity.zones[0]?.name || 'Commercial Zone'}`,
    `Synthesize Continuity Index for 2026`,
    `Check satellite pipeline latency`
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setIsSynthesizing(true);

    setTimeout(() => {
      let botResponse = `Analysis complete for ${currentCity.name}: Hydrologic continuity score is 82/100. Soil moisture retention is optimal at 32%, evapotranspiration is registered at 4.1mm/day. No critical ecosystem collapse detected.`;
      
      if (text.toLowerCase().includes('water')) {
        botResponse = `[WATER ENGINE SYNTHESIS]: Catchment level for ${currentCity.name} stands at 75%. Predicted runoff is 1.35 mm/h. We recommend preserving wetlands along key drainage corridors.`;
      } else if (text.toLowerCase().includes('lst') || text.toLowerCase().includes('heat')) {
        botResponse = `[HEAT ENGINE SYNTHESIS]: Land Surface Temperature (LST) averages ${currentCity.heatEngine.lstAvg}°C with a UHI delta of +${currentCity.heatEngine.uhiDelta}°C. High concrete density detected in central commercial districts.`;
      } else if (text.toLowerCase().includes('continuity')) {
        botResponse = `[CONTINUITY ENGINE SYNTHESIS]: Ecological stability index is currently ${currentCity.continuityEngine.stabilityIndex}. Temporal baseline (2016-2026) projects stable continuity under present green cover management.`;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setIsSynthesizing(false);
    }, 1000);
  };

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#0b0f19] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-amber-400" />
          Agents View (Vertex AI / Gemini Copilot)
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Gemini AI Engine Active</span>
        </div>
      </div>

      {/* Main Grid: AI Chat Copilot (Left) + Synthesis Reports & Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Interactive Chat Interface */}
        <div className="lg:col-span-7 bg-[#0e1424] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[520px]">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-amber-400" />
                Climate AI Agent Copilot
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Vertex AI Model: Gemini 1.5 Pro
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-medium text-slate-300 hover:text-white hover:border-amber-500/50 transition-all cursor-pointer"
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isSynthesizing && (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium italic">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Synthesizing satellite raster data with Gemini agent...
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-800"
          >
            <input
              type="text"
              placeholder="Ask AI Copilot about climate, water formulas, or anomalies..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-all"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right Column: Automated Report Synthesis & Logs */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Synthesized Report Box */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Automated Report Synthesis
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-cyan-300">
                Climate Intelligence Summary for {currentCity.name}
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Aggregated 5-engine evaluation indicates stable hydrologic baseline (Soil Moisture 32%, Catchment 75%). LST anomalies are concentrated in high-density urban corridors (+5.4°C UHI delta). Recommended mitigation: cool roofs & green corridors.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-400">
                <span>System Generated Report</span>
                <span className="text-amber-400 font-semibold">Climalenz AI Copilot</span>
              </div>
            </div>
          </div>

          {/* Exception & Alert Logs Stream */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              AI Agent Exception & Alert Logs
            </h3>

            <div className="space-y-2 text-xs">
              {agentLogs.map((log) => (
                <div key={log.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{log.timestamp}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.engine}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

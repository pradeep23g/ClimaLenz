import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { chatWithCopilot } from '../../services/api/bridgeClient';
import ReactMarkdown from 'react-markdown';

export const AgentsView = ({ missionControl, currentCity }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello! I am your ClimaLenz Copilot. I am ready to answer questions about the current assessment for ${currentCity?.name || 'your selected area'}.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const quickPrompts = [
    `Summarize the water risk for this area.`,
    `Explain the heat anomaly results.`,
    `What are the caveats of this data?`,
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setIsSynthesizing(true);

    const { report } = missionControl || {};
    let contextStr = '';
    if (report) {
      contextStr = `
[CURRENT ASSESSMENT CONTEXT]
Water Score: ${report.water_score ?? 'Not available in the current assessment'}
Heat Delta: Min ${report.heat_delta_summary?.min ?? 'N/A'}°C, Max ${report.heat_delta_summary?.max ?? 'N/A'}°C
Guardrail Status: ${report.heat_guardrail_status ?? 'Not available in the current assessment'}
Execution Mode: ${report.execution_mode ?? 'N/A'}
Data Provenance: ${report.provenance ?? 'N/A'}
`;
    } else {
      contextStr = `\n[CURRENT ASSESSMENT CONTEXT]\nNot available in the current assessment.\n`;
    }

    const fullPrompt = `${contextStr}\nUser Query: ${text}`;

    try {
      const response = await chatWithCopilot({
        session_id: 'local-session-123',
        prompt: fullPrompt
      });
      
      setMessages(prev => [...prev, { sender: 'bot', text: response.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `⚠️ **AI INTERPRETATION UNAVAILABLE**\n\nThe Copilot is currently offline or quota has been exhausted. \n\n*Error details: ${err.message}*` 
      }]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-[#0b0f19] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-amber-400" />
          ClimaLenz Copilot
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Gemini Agent Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chat Interface */}
        <div className="lg:col-span-8 bg-[#0e1424] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[600px] shadow-lg">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 tracking-wide uppercase">
                <BrainCircuit className="w-4 h-4 text-amber-400" />
                Live Session
              </h3>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isSynthesizing}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/50 text-[11px] font-medium text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 my-2 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-[13px] ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-[85%] leading-relaxed prose prose-sm prose-invert ${
                    msg.sender === 'user'
                      ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-800/50 rounded-br-none'
                      : 'bg-slate-900/80 border border-slate-700/50 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}

            {isSynthesizing && (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium italic p-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Synthesizing response with Copilot Agent...
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-4 border-t border-slate-800"
          >
            <input
              type="text"
              placeholder="Ask Copilot about the current assessment..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSynthesizing}
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-[13px] rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSynthesizing || !inputText.trim()}
              className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Context Information */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 tracking-wide uppercase border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-cyan-400" />
              Active Context
            </h3>
            
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The Copilot is aware of the current spatial assessment in your active monitor session.
              </p>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">AOI Status:</span>
                  <span className={missionControl?.report ? 'text-emerald-400' : 'text-slate-300'}>
                    {missionControl?.report ? 'LOADED' : 'IDLE'}
                  </span>
                </div>
                {missionControl?.report && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Score:</span>
                      <span className="text-slate-300">{missionControl.report.water_score ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provenance:</span>
                      <span className="text-slate-300 truncate max-w-[120px] text-right" title={missionControl.report.provenance}>
                        {missionControl.report.provenance}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

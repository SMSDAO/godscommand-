import React, { useState } from 'react';
import { Cpu, Send, Sparkles, Bot, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiCommandView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'GODS REVENUE RECOVERY & CONTRACTOR COMMAND AI online. I have analyzed your live business database. How can I assist your operations today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const presetQueries = [
    "Show me today's revenue and gross profit",
    "Which pending leads need immediate follow-up?",
    "Summarize unpaid invoices and cash flow",
    "Which jobs have the highest profit margins?"
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });
      const data = await res.json();

      const aiMsg: Message = {
        sender: 'ai',
        text: data.result || 'Neural Core processed your request successfully.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Error communicating with GODS AI Neural Core. Please verify API key configuration.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 h-[calc(100vh-140px)] flex flex-col">
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 border border-blue-400/40 flex items-center justify-center text-cyan-300 neon-border-blue">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white">GODS AI Neural Command Center</h1>
              <span className="px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-300 rounded font-bold border border-violet-500/30">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">Conversational business intelligence connected directly to your contractor ERP database.</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mt-4">
          {presetQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pq)}
              className="px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 text-cyan-300 text-xs font-medium border border-blue-500/30 transition-all flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>{pq}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="glass-panel flex-1 rounded-3xl border border-blue-500/30 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-start space-x-3 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-violet-600/50 text-cyan-300 border border-violet-400/40'
            }`}>
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
              m.sender === 'user'
                ? 'bg-blue-600/30 border border-blue-400/30 text-white rounded-tr-none'
                : 'bg-slate-900/80 border border-blue-500/20 text-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-line">{m.text}</p>
              <span className="text-[10px] text-slate-500 mt-2 block font-mono">{m.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-cyan-400 text-xs italic">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>GODS Neural Core computing response...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="glass-panel p-3 rounded-2xl border border-blue-500/30 flex items-center space-x-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask GODS AI anything about revenue, leads, estimates, or jobs..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

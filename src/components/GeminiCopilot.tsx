import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, Send, X, Bot, User, Sparkles, Loader, MessageSquare, ArrowRight, CornerDownLeft 
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

interface GeminiCopilotProps {
  onClose: () => void;
}

export default function GeminiCopilot({ onClose }: GeminiCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi! I'm Lumina, your predictive supply chain assistant. I have live awareness of your active inventory, safety thresholds, and supplier lead times. What would you like to accomplish today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    "Which items have high stockout risks?",
    "Draft a supplier email for low stock items",
    "How should I reduce holding costs for overstock?"
  ];

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: "msg-" + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const token = localStorage.getItem('inventory_session_token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'The AI assistant timed out.');
      }

      const botMsg: Message = {
        id: "msg-" + Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        text: data.reply
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: "msg-err-" + Math.random(),
        sender: 'bot',
        text: `⚠️ Advisory: ${err.message || 'Failed to establish connection to server-side Gemini assistant. Verify that your GEMINI_API_KEY is active.'}`
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Handle Enter keypress
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // Render markdown-like lists inside messaging bubbles
  const renderMessageText = (txt: string) => {
    const lines = txt.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;
      // Simple bold parsing
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={idx} className="mb-1 text-xs">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-slate-900">{part}</strong> : part)}
          </p>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc mb-0.5 text-xs">
            {line.trim().substring(2)}
          </li>
        );
      }
      return <p key={idx} className="mb-1 text-xs">{formatted}</p>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100 shadow-xl font-sans w-full max-w-md">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Lumina AI Analyst</h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Grounded in inventory metrics
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar">
        {messages.map(msg => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={msg.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`flex items-start max-w-[85%] space-x-2 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                <div className={`p-1.5 rounded-lg shrink-0 ${isBot ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>

                <div className={`p-3 rounded-2xl ${isBot ? 'bg-slate-50 text-slate-800 rounded-tl-none' : 'bg-emerald-600 text-white rounded-tr-none'}`}>
                  {isBot ? (
                    <div className="space-y-1 text-slate-700 leading-relaxed">
                      {renderMessageText(msg.text)}
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[85%]">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <Loader className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span className="text-xs text-slate-500 font-medium">Lumina is formulating answer...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Panel (Quick prompts and message inputs) */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested queries</span>
            <div className="flex flex-col space-y-1">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 p-2 rounded-lg border border-slate-100 transition-all flex items-center justify-between"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="h-3 w-3 opacity-50 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Text Form */}
        <div className="relative rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 overflow-hidden shadow-xs">
          <textarea
            rows={2}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lumina to audit low stocks or write supplier templates..."
            className="w-full resize-none border-0 bg-transparent py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-0"
          />
          <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
              <CornerDownLeft className="h-3 w-3" />
              <span>Enter to send</span>
            </div>
            
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
              className="p-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

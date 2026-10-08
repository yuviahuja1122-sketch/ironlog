import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  Flame, 
  FileText, 
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: '📊 Daily Summary', prompt: 'Give me my daily summary for today: workouts, nutrition targets, and tomorrow’s game plan.' },
  { label: '📅 Weekly Review', prompt: 'Can you analyze my weekly workout volume, consistency streak, and strength trends?' },
  { label: '🔥 Rate My Cut Progress', prompt: 'How is my weight trend and protein adherence looking compared to my cutting target?' },
  { label: '💡 Recovery & Soreness Fix', prompt: 'What recovery protocols, sleep, and active mobility should I focus on for fast muscle recovery?' },
];

export default function Coach() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      setInitialLoading(true);
      const res = await aiApi.getHistory();
      if (res && res.length > 0) {
        setMessages(res);
      } else {
        // Welcoming first message if brand new user
        setMessages([
          {
            role: 'assistant',
            content: `Hey ${profile?.name || 'Athlete'}! I'm your IronLog AI Coach. I have your full profile (${profile?.goal || 'cut'} goal, targets, weight history, and workout logs) in my memory. How are you feeling today? Ready to review your numbers or plan your next workout? 💪`
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat(text);
      const aiMsg = { role: 'assistant', content: res.response, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat request failed', err);
      const errorMsg = { 
        role: 'assistant', 
        content: 'I had a momentary hiccup connecting to the coaching engine. Please try sending your message again!' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] md:h-[calc(100vh-110px)] max-w-4xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100 flex items-center gap-2">
              IronLog AI Coach
              <Badge variant="success" size="xs">Live Context Active</Badge>
            </h1>
            <p className="text-[11px] text-zinc-400">Personalized programming, strength progression & nutrition intelligence</p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          title="Refresh History"
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(action.prompt)}
            disabled={loading}
            className="whitespace-nowrap bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/40 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-blue-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-4 overflow-y-auto space-y-4 shadow-inner">
        {initialLoading ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading coach memory...</span>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    isUser
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  }`}
                >
                  {isUser ? <User size={15} /> : <Bot size={15} />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-emerald-500/15 text-zinc-100 border border-emerald-500/30 rounded-tr-sm shadow-sm'
                      : 'bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 rounded-tl-sm text-xs flex items-center gap-1.5 text-blue-400">
              <span className="font-semibold">Coach is analyzing your data</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask coach about form, PRs, soreness, cutting tips, or macros..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent border-none px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

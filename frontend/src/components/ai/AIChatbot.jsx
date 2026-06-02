"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatMascot from './AIChatbotMascot';
import api from '@/lib/api';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya asisten AI Gudang Komputer. Ada yang bisa saya bantu terkait komponen PC atau rekomendasi rakitan?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        session_id: sessionId || null,
        context_type: 'general'
      });

      setSessionId(res.data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi server AI. Silakan coba lagi.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans antialiased bg-slate-100 min-h-screen p-8 flex flex-col justify-between">

      {/* --- 1. FLOATING BUTTON WITH MASCOT --- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-1 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 flex items-center justify-center hover:-translate-y-1 group"
          >
            {/* Ping Indicator */}
            <div className="absolute -top-1 -right-1">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
            </div>

            {/* Gantikan Icon "Bot" lama dengan Maskot Ukuran Besar (lg) */}
            <AIChatMascot isStatusTyping={false} size="lg" />

            <div className="absolute right-20 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Ada yang bisa saya bantu?
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- CHAT WINDOW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{
              y: isMinimized ? 'calc(100% - 68px)' : 0,
              opacity: 1,
              scale: 1
            }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            className="fixed bottom-6 right-6 z-50 flex items-end origin-bottom-right"
          >
            {/* --- MASKOT SISI KIRI (di luar popup, tinggi ½ dari popup = 270px) --- */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, x: 28, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 28, scale: 0.8 }}
                  transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
                  className="mr-2 shrink-0 self-end drop-shadow-2xl rounded-[3rem] bg-slate-900/60 backdrop-blur-md border border-white/10 overflow-hidden"
                  style={{ height: '470px', width: '180px' }}
                >
                  <AIChatMascot isStatusTyping={loading} size="side" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- KOTAK CHAT --- */}
            <div
              className="w-full max-w-[380px] flex flex-col shadow-2xl overflow-hidden rounded-2xl bg-white border border-slate-100"
              style={{ height: isMinimized ? 'auto' : '540px', maxHeight: '85vh' }}
            >
              {/* --- 2. HEADER WITH MASCOT --- */}
              <div
                className="bg-indigo-600 p-4 flex items-center justify-between cursor-pointer border-b border-indigo-700/10"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-3">
                  {/* Gantikan avatar lama dengan Maskot Interaktif! 
                    Ia akan membaca state 'loading' dan berubah ke mode berpikir
                  */}
                  <AIChatMascot isStatusTyping={loading} size="md" />

                  <div>
                    <h3 className="font-bold text-white leading-tight flex items-center gap-1.5 text-sm">
                      Asisten Gudang <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    </h3>
                    <span className="text-xs text-indigo-100 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 border border-emerald-300 animate-pulse"></span>
                      {loading ? "Sedang mengetik..." : "Online"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white/80">
                  <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors">
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* --- CHAT AREA --- */}
              {!isMinimized && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* --- 3. CHAT BUBBLE WITH MINI MASCOT --- */}
                        {msg.role === 'assistant' && (
                          <div className="mr-2 mt-0.5 shrink-0">
                            {/* Maskot berukuran kecil (sm) untuk mempercantik avatar chat balasan */}
                            <AIChatMascot isStatusTyping={false} size="sm" />
                          </div>
                        )}

                        <div className={`max-w-[78%] p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white text-slate-800 border border-slate-200/60 rounded-2xl rounded-tl-sm'
                          }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none space-y-1.5">
                              {msg.content.split('\n').map((line, i) => {
                                // Parser Markdown Sederhana untuk **bold** dan *italic*
                                const parseLine = (text) => {
                                  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
                                  return parts.map((part, j) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                      return <strong key={j} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>;
                                    }
                                    if (part.startsWith('*') && part.endsWith('*')) {
                                      return <em key={j} className="italic text-slate-700">{part.slice(1, -1)}</em>;
                                    }
                                    return <span key={j}>{part}</span>;
                                  });
                                };

                                // Bullet list item
                                if (line.match(/^[-•*]\s/)) {
                                  return (
                                    <div key={i} className="flex gap-2 items-start pl-1">
                                      <span className="text-indigo-600 mt-1 shrink-0 text-xs">•</span>
                                      <span className="text-slate-700">{parseLine(line.slice(2))}</span>
                                    </div>
                                  );
                                }
                                // Numbered list
                                if (line.match(/^\d+\.\s/)) {
                                  return (
                                    <div key={i} className="flex gap-2 items-start pl-1">
                                      <span className="text-indigo-600 font-bold shrink-0 text-xs">{line.match(/^\d+/)[0]}.</span>
                                      <span className="text-slate-700">{parseLine(line.replace(/^\d+\.\s/, ''))}</span>
                                    </div>
                                  );
                                }
                                // Empty line → spacer
                                if (line.trim() === '') return <div key={i} className="h-1" />;
                                // Normal paragraph
                                return <p key={i} className="text-slate-700">{parseLine(line)}</p>;
                              })}
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Loading State & Thinking Mascot */}
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="mr-2 mt-0.5 shrink-0">
                          {/* Memasang maskot mini dalam mode 'thinking' saat asisten sedang menulis */}
                          <AIChatMascot isStatusTyping={true} size="sm" />
                        </div>
                        <div className="bg-white border border-slate-200/60 p-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center h-[38px]">
                          <span className="w-1.5 h-1.5 bg-indigo-500/80 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500/80 rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500/80 rounded-full animate-bounce delay-200"></span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* INPUT AREA */}
                  <div className="p-3 bg-white border-t border-slate-100">
                    <form onSubmit={sendMessage} className="flex gap-2 relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tanya tentang rakitan PC..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-1 top-1 bottom-1 aspect-square rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-0 disabled:scale-75 flex items-center justify-center duration-200"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                    <div className="text-center mt-2">
                      <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> AI dapat memberikan informasi yang kurang tepat.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

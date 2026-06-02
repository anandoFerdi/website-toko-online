"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, Search, Eye, X, Bot, User } from 'lucide-react';
import api from '@/lib/api';

export default function AdminAIChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/ai/history');
      // The API returns individual chat messages, but we want to group them by session_id
      // to display in the table. Let's group them client-side for simplicity, 
      // or just show the latest message per session.
      const chatData = res.data.data || res.data;
      
      const uniqueSessions = [];
      const sessionMap = new Map();
      
      for (const chat of chatData) {
        if (!sessionMap.has(chat.session_id)) {
          sessionMap.set(chat.session_id, true);
          uniqueSessions.push(chat);
        }
      }
      
      setChats(uniqueSessions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(c => 
    c.session_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.message?.toLowerCase().includes(search.toLowerCase())
  );

  const openDetailModal = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/ai/history/${sessionId}`);
      setSessionHistory(res.data);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSessionId(null);
    setSessionHistory([]);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Riwayat AI Chat
          </h1>
          <p className="text-text-muted mt-1">Pantau interaksi pengguna dengan AI Assistant.</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari Session ID atau Pesan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-text-muted font-medium">
            Total Sesi: {filteredChats.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Waktu (Terakhir)</th>
                <th className="px-6 py-4">Session ID</th>
                <th className="px-6 py-4">Konteks</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Pesan Singkat</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-surface-darker border-t-primary"></div></div>
                  </td>
                </tr>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(chat.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-muted">
                      {chat.session_id ? chat.session_id.split('-')[0] + '...' : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold uppercase">
                        {chat.context_type || 'general'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {chat.user ? (
                        <div className="font-medium text-text-main">{chat.user.name}</div>
                      ) : (
                        <div className="text-text-muted italic">Guest</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted truncate max-w-[200px]" title={chat.message}>
                      {chat.message}
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      <button 
                        onClick={() => openDetailModal(chat.session_id)}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Chat
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-muted">
                    Tidak ada riwayat chat ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat History Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter shrink-0">
              <div>
                <h2 className="font-bold text-lg text-text-main flex items-center gap-2">
                  Riwayat Percakapan
                </h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">Session: {selectedSessionId}</p>
              </div>
              <button onClick={closeModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-background flex-1 space-y-4 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-surface-darker border-t-primary"></div>
                </div>
              ) : (
                sessionHistory.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mr-3 mt-1 border border-primary/20">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] p-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-text-main border border-border rounded-2xl rounded-tl-sm'
                    }`}>
                      {/* Check if message is a JSON string (for builder results) */}
                      {msg.context_type === 'builder' && msg.message.startsWith('{') ? (
                        <div className="font-mono text-xs whitespace-pre-wrap">
                          [Rekomendasi Rakitan PC Dihasilkan]
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                      )}
                      
                      <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-white/70' : 'text-text-muted'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-surface-lighter flex items-center justify-center text-text-muted shrink-0 ml-3 mt-1 border border-border">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sessionHistory.length === 0 && !loadingHistory && (
                <div className="text-center text-text-muted p-4">Tidak ada pesan dalam sesi ini.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRightLeft, AlertTriangle, CheckCircle, Search, HelpCircle } from 'lucide-react';
import api from '@/lib/api';

export default function CompatibilityPage() {
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const checkComp = async () => {
    if (!comp1 || !comp2) return;

    setLoading(true);
    try {
      const res = await api.post('/ai/compatibility', {
        component1: comp1,
        component2: comp2
      });
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Gagal mengecek kompatibilitas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-secondary-light rounded-2xl mb-6 shadow-sm border border-secondary/20">
            <ShieldCheck className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-main mb-4 tracking-tight">Cek Kompatibilitas Komponen</h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Ragu komponen A cocok dengan komponen B? Masukkan nama komponen di bawah dan AI teknisi kami akan memastikan semuanya berjalan lancar tanpa error.
          </p>
        </div>

        <div className="card p-6 md:p-10 relative overflow-hidden shadow-lg border-border">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-light/50 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-light/50 rounded-full blur-[80px] -z-10 -translate-x-1/2 translate-y-1/2" />

          {/* Input Form */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

            <div className="w-full">
              <label className="block text-sm font-bold text-text-main mb-2 ml-1 flex items-center gap-1.5">
                Komponen 1
                <span className="text-text-light font-normal text-xs">(Misal: Intel i5 13400F)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light w-5 h-5" />
                <input
                  type="text"
                  value={comp1}
                  onChange={(e) => setComp1(e.target.value)}
                  placeholder="Cari prosesor, VGA..."
                  className="input-field !pl-12 py-3.5 shadow-sm"
                />
              </div>
            </div>

            <div className="hidden md:flex p-3 bg-white rounded-full border border-border shadow-sm z-10 text-text-light">
              <ArrowRightLeft className="w-5 h-5" />
            </div>

            <div className="w-full">
              <label className="block text-sm font-bold text-text-main mb-2 ml-1 flex items-center gap-1.5">
                Komponen 2
                <span className="text-text-light font-normal text-xs">(Misal: ASUS ROG B760)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light w-5 h-5" />
                <input
                  type="text"
                  value={comp2}
                  onChange={(e) => setComp2(e.target.value)}
                  placeholder="Cari motherboard, RAM..."
                  className="input-field !pl-12 py-3.5 shadow-sm"
                />
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="mt-8 flex justify-center relative z-10 border-b border-border pb-8">
            <button
              onClick={checkComp}
              disabled={loading || !comp1 || !comp2}
              className="btn-primary w-full md:w-auto md:px-12 py-3.5 text-lg shadow-btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></span>
                  Menganalisis...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Cek Kecocokan
                </>
              )}
            </button>
          </div>

          {/* Result Area */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 overflow-hidden"
              >
                <div className={`p-6 md:p-8 rounded-2xl border flex flex-col md:flex-row gap-6 shadow-sm ${result.compatible === true ? 'bg-success-light border-success/20' :
                    result.compatible === false ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                  }`}>

                  {/* Status Icon */}
                  <div className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm ${result.compatible === true ? 'text-success' :
                      result.compatible === false ? 'text-red-500' :
                        'text-yellow-500'
                    }`}>
                    {result.compatible === true ? <CheckCircle className="w-8 h-8" /> :
                      result.compatible === false ? <AlertTriangle className="w-8 h-8" /> :
                        <HelpCircle className="w-8 h-8" />}
                  </div>

                  {/* Status Content */}
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${result.compatible === true ? 'text-green-800' :
                        result.compatible === false ? 'text-red-800' :
                          'text-yellow-800'
                      }`}>
                      {result.status}
                    </h3>
                    <p className={`leading-relaxed mb-5 ${result.compatible === true ? 'text-green-700' :
                        result.compatible === false ? 'text-red-700' :
                          'text-yellow-700'
                      }`}>
                      {result.reason}
                    </p>

                    {/* AI Recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="bg-white/60 rounded-xl p-5 border border-white/40">
                        <h4 className="font-bold text-sm text-text-main mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-text-light" /> Saran AI untuk Anda:
                        </h4>
                        <ul className="space-y-2">
                          {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-text-main">
                              <span className="w-1.5 h-1.5 rounded-full bg-text-light mt-1.5 shrink-0"></span>
                              <span className="leading-snug">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-muted flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Hasil analisis diberikan oleh AI dan berdasarkan spesifikasi umum pabrikan.
          </p>
        </div>
      </div>
    </div>
  );
}

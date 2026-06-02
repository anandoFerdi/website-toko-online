"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Check, ChevronRight, Settings, Cpu, DollarSign, Briefcase, Plus, ShoppingCart, Info, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function AIBuilderPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [buildResult, setBuildResult] = useState(null);
  
  const [preferences, setPreferences] = useState({
    budget: 10000000,
    useCase: 'Gaming',
    cpuBrand: 'Any',
    gpuBrand: 'Any'
  });

  const generateBuild = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/build', {
        budget: preferences.budget,
        use_case: preferences.useCase,
        cpu_brand: preferences.cpuBrand,
        gpu_brand: preferences.gpuBrand
      });
      setBuildResult(res.data);
      setStep(4);
    } catch (error) {
      console.error("Build generation failed:", error);
      alert("Gagal membuat rekomendasi PC. Pastikan server AI terhubung.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Budget' },
    { num: 2, title: 'Kebutuhan' },
    { num: 3, title: 'Preferensi' },
    { num: 4, title: 'Hasil AI' },
  ];

  return (
    <div className="bg-background min-h-screen py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="ai-tag mx-auto mb-4">
            <Bot className="w-4 h-4" /> Asisten AI
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-text-main mb-4">Rakit PC dengan AI</h1>
          <p className="text-text-muted max-w-2xl mx-auto text-lg">
            Asisten cerdas kami akan menganalisis komponen terbaik sesuai budget dan kebutuhan Anda untuk performa maksimal.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between relative mb-12 max-w-3xl mx-auto">
          <div className="absolute top-5 left-0 w-full h-1 bg-border -z-10 rounded-full"></div>
          <div 
            className="absolute top-5 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= s.num 
                  ? 'bg-primary text-white shadow-btn-primary' 
                  : 'bg-white border-2 border-border text-text-light'
              }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs font-semibold ${step >= s.num ? 'text-text-main' : 'text-text-light'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="card p-6 md:p-10 min-h-[420px] relative overflow-hidden shadow-lg border-border">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Budget */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-text-main mb-2">Berapa Budget Anda?</h2>
                  <p className="text-sm text-text-muted">Pilih atau masukkan kisaran budget untuk merakit PC Anda.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto w-full">
                  {[5000000, 10000000, 15000000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPreferences({...preferences, budget: val})}
                      className={`py-4 rounded-xl border-2 transition-all font-bold ${
                        preferences.budget === val 
                          ? 'border-primary bg-primary-light text-primary shadow-sm' 
                          : 'border-border bg-white text-text-main hover:border-border-dark'
                      }`}
                    >
                      Rp {val.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                <div className="max-w-md mx-auto w-full">
                  <label className="block text-xs font-bold text-text-muted mb-2 text-center uppercase tracking-wider">Atau masukkan kustom</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">Rp</span>
                    <input 
                      type="number" 
                      value={preferences.budget || ''}
                      onChange={(e) => setPreferences({...preferences, budget: parseInt(e.target.value) || 0})}
                      className="input-field pl-12 py-3 text-lg font-bold text-center"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-auto pt-8">
                  <button 
                    onClick={() => setStep(2)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Selanjutnya <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Kebutuhan */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-text-main mb-2">Pilih Kebutuhan Utama</h2>
                  <p className="text-sm text-text-muted">Ini akan membantu AI menentukan prioritas komponen (GPU vs CPU).</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full mb-8">
                  {[
                    { id: 'Gaming', icon: <DollarSign className="w-6 h-6 mb-2" />, desc: 'Fokus pada Kartu Grafis' },
                    { id: 'Editing', icon: <Briefcase className="w-6 h-6 mb-2" />, desc: 'Fokus Prosesor & RAM' },
                    { id: 'Streaming', icon: <Bot className="w-6 h-6 mb-2" />, desc: 'Seimbang CPU & GPU' },
                    { id: 'Coding', icon: <Cpu className="w-6 h-6 mb-2" />, desc: 'Kecepatan Prosesor' },
                    { id: 'Office', icon: <Settings className="w-6 h-6 mb-2" />, desc: 'Basic & Hemat Budget' }
                  ].map((use) => (
                    <button
                      key={use.id}
                      onClick={() => setPreferences({...preferences, useCase: use.id})}
                      className={`p-5 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
                        preferences.useCase === use.id 
                          ? 'border-primary bg-primary-light text-primary shadow-sm' 
                          : 'border-border bg-white text-text-main hover:border-border-dark'
                      }`}
                    >
                      {use.icon}
                      <span className="font-bold text-sm mb-1">{use.id}</span>
                      <span className="text-[10px] opacity-80">{use.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-auto pt-8 border-t border-border">
                  <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                    Kembali
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Selanjutnya <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Preferensi */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-text-main mb-2">Preferensi Brand (Opsional)</h2>
                  <p className="text-sm text-text-muted">Punya brand favorit? Beritahu AI kami.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full mb-8">
                  <div className="bg-surface-lighter p-5 rounded-xl border border-border">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-text-muted" /> Prosesor (CPU)
                    </h3>
                    <div className="flex flex-col gap-3">
                      {['Any', 'Intel', 'AMD'].map(brand => (
                        <button
                          key={brand}
                          onClick={() => setPreferences({...preferences, cpuBrand: brand})}
                          className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-left flex justify-between items-center ${
                            preferences.cpuBrand === brand 
                              ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                              : 'border-border bg-white text-text-main hover:border-border-dark'
                          }`}
                        >
                          {brand === 'Any' ? 'Tidak Ada Preferensi' : brand}
                          {preferences.cpuBrand === brand && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-surface-lighter p-5 rounded-xl border border-border">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-text-muted" /> Kartu Grafis (GPU)
                    </h3>
                    <div className="flex flex-col gap-3">
                      {['Any', 'NVIDIA', 'Radeon'].map(brand => (
                        <button
                          key={brand}
                          onClick={() => setPreferences({...preferences, gpuBrand: brand})}
                          className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-left flex justify-between items-center ${
                            preferences.gpuBrand === brand 
                              ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                              : 'border-border bg-white text-text-main hover:border-border-dark'
                          }`}
                        >
                          {brand === 'Any' ? 'Tidak Ada Preferensi' : brand}
                          {preferences.gpuBrand === brand && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-auto pt-8 border-t border-border">
                  <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                    Kembali
                  </button>
                  <button 
                    onClick={generateBuild}
                    disabled={loading}
                    className="btn-primary bg-secondary hover:bg-secondary-dark shadow-btn flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {loading ? (
                      <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></span> AI Memproses...</>
                    ) : (
                      <><Bot className="w-5 h-5" /> Mulai Merakit (AI)</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Hasil */}
            {step === 4 && buildResult && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-8 border-b border-border pb-8">
                  <div className="inline-flex px-3 py-1 bg-success-light text-success rounded-full text-xs font-bold mb-4 items-center gap-1.5 border border-success/20">
                    <Check className="w-3.5 h-3.5" /> 100% Kompatibel & Optimal
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-text-main mb-2">
                    Rekomendasi PC {preferences.useCase} Anda
                  </h2>
                  <p className="text-text-muted text-sm max-w-xl mx-auto">{buildResult.summary}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Komponen List */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-text-main flex items-center gap-2 mb-2">
                      <ShoppingCart className="w-5 h-5 text-primary" /> Daftar Komponen
                    </h3>
                    
                    <div className="bg-surface-lighter rounded-xl border border-border divide-y divide-border overflow-hidden">
                      {buildResult.build?.map((item, idx) => (
                        <div key={idx} className="p-4 bg-white hover:bg-surface-lighter transition-colors flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{item.component}</div>
                            <div className="font-bold text-text-main text-sm mb-1">{item.name}</div>
                            <p className="text-xs text-text-muted bg-surface-lighter p-2 rounded border border-border inline-block mt-1">
                              <Info className="w-3 h-3 inline mr-1 text-text-light" />
                              {item.reason}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-text-main">Rp {item.price?.toLocaleString('id-ID')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Action */}
                  <div className="space-y-4">
                    <div className="bg-primary-light/50 border border-primary/20 rounded-xl p-5 shadow-sm">
                      <h4 className="font-bold text-primary mb-3 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                        <Settings className="w-4 h-4" /> Estimasi Performa
                      </h4>
                      <p className="text-sm text-text-main leading-relaxed mb-0 font-medium">
                        {buildResult.performance_estimate}
                      </p>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                      <div className="text-sm text-text-muted mb-1">Total Estimasi Harga</div>
                      <div className="text-2xl font-extrabold text-primary mb-6">
                        Rp {buildResult.total_price?.toLocaleString('id-ID')}
                      </div>
                      
                      <button className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                        <ShoppingCart className="w-5 h-5" /> Beli Semua Paket
                      </button>
                      <button onClick={() => setStep(1)} className="w-full py-2.5 text-sm font-bold text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Rakit Ulang
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

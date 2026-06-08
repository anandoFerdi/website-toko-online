"use client";

import { useState } from 'react';
import { Search, Package, MapPin, Truck, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import TrackingTimeline from '@/components/shipping/TrackingTimeline';

export default function TrackingPage() {
  const [waybill, setWaybill] = useState('');
  const [courier, setCourier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState(null);

  const couriers = [
    { id: 'jne', name: 'JNE' },
    { id: 'jnt', name: 'J&T Express' },
    { id: 'sicepat', name: 'SiCepat' },
    { id: 'anteraja', name: 'AnterAja' },
    { id: 'ide', name: 'ID Express' },
    { id: 'tiki', name: 'TIKI' },
    { id: 'pos', name: 'POS Indonesia' },
    { id: 'ninja', name: 'Ninja Express' },
    { id: 'lion', name: 'Lion Parcel' },
    { id: 'sap', name: 'SAP Express' },
    { id: 'wahana', name: 'Wahana' },
  ];

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!waybill.trim()) return;

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const res = await api.get(`/shipping/track?waybill_id=${encodeURIComponent(waybill)}&courier_code=${encodeURIComponent(courier)}`);
      setTrackingData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Nomor resi tidak ditemukan atau terjadi kesalahan server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white pt-24 pb-32 px-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Lacak Pesanan Kamu</h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Ketahui posisi paketmu secara real-time. Masukkan nomor resi yang telah kami berikan.
          </p>

          <form onSubmit={handleTrack} className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-gray-400 absolute left-4" />
              <input
                type="text"
                value={waybill}
                onChange={(e) => setWaybill(e.target.value)}
                placeholder="Masukkan Nomor Resi (Contoh: GK-123456789)"
                className="w-full pl-12 pr-4 py-4 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            
            <div className="w-full md:w-48 relative border-t md:border-t-0 md:border-l border-gray-100">
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full pl-4 pr-10 py-4 text-gray-600 appearance-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl"
              >
                <option value="">Semua Kurir</option>
                {couriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !waybill.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lacak'}
            </button>
          </form>
        </div>
      </div>

      {/* Result Section */}
      <div className="container mx-auto max-w-3xl px-4 -mt-16 pb-20 relative z-20">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-start gap-4 shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
            <div>
              <h3 className="font-bold mb-1">Paket tidak ditemukan</h3>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2 opacity-80">Catatan: Resi yang baru dibuat mungkin membutuhkan waktu 1x24 jam untuk terupdate di sistem kurir.</p>
            </div>
          </div>
        )}

        {trackingData && !error && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4">
            <TrackingTimeline data={trackingData} />
          </div>
        )}

        {!trackingData && !error && !loading && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-border p-10 text-center">
            <Package className="w-16 h-16 text-blue-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">Siap Melacak</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Informasi tracking akan muncul di sini. Jika kamu baru saja melakukan pemesanan, pastikan status pesanan sudah "Dikirim" untuk mendapatkan nomor resi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

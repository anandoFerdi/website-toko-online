"use client";

import { useState, useEffect, useCallback } from 'react';
import { Truck, Clock, Package, AlertCircle, Loader2, CheckCircle2, Gift } from 'lucide-react';
import api from '@/lib/api';

// Courier logos/icons mapping
const COURIER_INFO = {
  jne: { name: 'JNE', color: '#e74c3c', emoji: '🔴' },
  jnt: { name: 'J&T Express', color: '#e91e63', emoji: '🟣' },
  sicepat: { name: 'SiCepat', color: '#ff6b35', emoji: '🟠' },
  anteraja: { name: 'AnterAja', color: '#6c5ce7', emoji: '🟡' },
  ide: { name: 'ID Express', color: '#0984e3', emoji: '🔵' },
  tiki: { name: 'TIKI', color: '#00b894', emoji: '🟢' },
  pos: { name: 'POS Indonesia', color: '#e17055', emoji: '🟤' },
  ninja: { name: 'Ninja Express', color: '#6c5ce7', emoji: '🟣' },
  lion: { name: 'Lion Parcel', color: '#1e3799', emoji: '🔵' },
  sap: { name: 'SAP Express', color: '#fdcb6e', emoji: '🟡' },
  wahana: { name: 'Wahana', color: '#00cec9', emoji: '🩵' },
};

function formatDuration(min, max) {
  if (!min && !max) return 'Estimasi tidak tersedia';
  if (min === max) return `${min} hari`;
  return `${min}–${max} hari`;
}

export default function CourierSelector({ destinationAreaId, weight, subtotal, onSelect, selectedCourier }) {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState(500000);

  const FREE_THRESHOLD = freeThreshold;

  const fetchRates = useCallback(async () => {
    if (!destinationAreaId || !weight) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/shipping/rates', {
        destination_area_id: destinationAreaId,
        weight,
        subtotal,
      });

      setPricing(res.data.pricing || []);
      setIsFreeShipping(res.data.is_free_shipping || false);
      setFreeThreshold(res.data.free_shipping_threshold || 500000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal memuat pilihan kurir';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [destinationAreaId, weight, subtotal]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  if (!destinationAreaId) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <Truck className="w-5 h-5 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500">
          Lengkapi alamat pengiriman untuk melihat pilihan kurir &amp; harga ongkir.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-orange-800">{error}</p>
          <button onClick={fetchRates} className="text-xs text-orange-600 underline mt-1 hover:text-orange-700">
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (pricing.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <Package className="w-5 h-5 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500">Tidak ada layanan kurir tersedia untuk area ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Free shipping banner */}
      {isFreeShipping && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <Gift className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">🎉 Selamat! Kamu dapat GRATIS ONGKIR</p>
            <p className="text-xs text-green-600">Pembelian ≥ Rp {FREE_THRESHOLD.toLocaleString('id-ID')} mendapat subsidi ongkir penuh</p>
          </div>
        </div>
      )}

      {/* Courier list */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {pricing.map((option) => {
          const info = COURIER_INFO[option.courier_code?.toLowerCase()] || {};
          const isSelected = selectedCourier?.courier_company === option.courier_code &&
                             selectedCourier?.courier_service === option.courier_type;
          const effectivePrice = isFreeShipping ? 0 : option.price;

          return (
            <button
              key={`${option.courier_code}-${option.courier_type}`}
              type="button"
              onClick={() => onSelect({
                courier_company: option.courier_code,
                courier_service: option.courier_type,
                courier_service_name: `${info.name || option.courier_code?.toUpperCase()} ${option.courier_service_name || option.courier_type?.toUpperCase()}`,
                shipping_cost: effectivePrice,
                original_price: option.price,
              })}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                }`}
            >
              <div className="flex items-center gap-3">
                {/* Radio */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>

                {/* Courier icon */}
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                  {info.emoji || '📦'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">
                      {info.name || option.courier_code?.toUpperCase()}
                    </p>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {option.courier_service_name || option.courier_type?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(option.duration_range_min, option.duration_range_max)}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  {isFreeShipping ? (
                    <div>
                      <p className="text-xs line-through text-gray-400">
                        Rp {option.price?.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm font-bold text-green-600">GRATIS</p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      Rp {option.price?.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

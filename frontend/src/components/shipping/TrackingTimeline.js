"use client";

import { Package, Truck, CheckCircle2, Clock, AlertCircle, MapPin, Home, Search } from 'lucide-react';

const STATUS_CONFIG = {
  // Biteship statuses
  'allocated': { icon: Package, color: 'blue', label: 'Pesanan Diproses', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'confirmed': { icon: Package, color: 'blue', label: 'Pesanan Dikonfirmasi', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'picking_up': { icon: Truck, color: 'orange', label: 'Sedang Dijemput', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  'picked': { icon: Package, color: 'purple', label: 'Paket Dijemput Kurir', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'dropping_off': { icon: Truck, color: 'indigo', label: 'Dalam Pengiriman', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  'in_transit': { icon: Truck, color: 'indigo', label: 'Dalam Perjalanan', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  'return_in_transit': { icon: Truck, color: 'yellow', label: 'Paket Kembali', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  'delivered': { icon: CheckCircle2, color: 'green', label: 'Terkirim', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'rejected': { icon: AlertCircle, color: 'red', label: 'Paket Ditolak', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'cancelled': { icon: AlertCircle, color: 'red', label: 'Dibatalkan', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'returned': { icon: Home, color: 'gray', label: 'Dikembalikan', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TrackingStatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG['allocated'];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export default function TrackingTimeline({ data }) {
  if (!data) return null;

  const { courier, origin, destination, history = [], status, waybill_id, link } = data;
  const currentConfig = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG['allocated'];
  const CurrentIcon = currentConfig.icon;

  // Sort history newest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );

  return (
    <div className="space-y-6">
      {/* Current status card */}
      <div className={`p-5 rounded-2xl border-2 ${currentConfig.border} ${currentConfig.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentConfig.bg} border-2 ${currentConfig.border} shrink-0`}>
            <CurrentIcon className={`w-6 h-6 ${currentConfig.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-lg font-bold ${currentConfig.text}`}>{currentConfig.label}</p>
            {waybill_id && (
              <p className="text-sm text-gray-600 mt-0.5">
                No. Resi: <span className="font-mono font-bold">{waybill_id}</span>
              </p>
            )}
            {courier?.name && (
              <p className="text-sm text-gray-500">Kurir: {courier.name}</p>
            )}
          </div>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline shrink-0"
            >
              Lacak di Kurir →
            </a>
          )}
        </div>

        {/* Shipper → Destination */}
        {(origin || destination) && (
          <div className="mt-4 pt-4 border-t border-current/20 grid grid-cols-2 gap-4">
            {origin && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dari</p>
                <p className="text-sm font-medium text-gray-800">{origin.district_name || origin.address || '-'}</p>
                {origin.city_name && <p className="text-xs text-gray-500">{origin.city_name}</p>}
              </div>
            )}
            {destination && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ke</p>
                <p className="text-sm font-medium text-gray-800">{destination.district_name || destination.address || '-'}</p>
                {destination.city_name && <p className="text-xs text-gray-500">{destination.city_name}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline history */}
      {sortedHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Riwayat Pengiriman
          </h4>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {sortedHistory.map((event, idx) => {
                const evConfig = STATUS_CONFIG[event.status?.toLowerCase()] || {
                  icon: MapPin, bg: 'bg-gray-100', text: 'text-gray-600', color: 'gray'
                };
                const EvIcon = evConfig.icon;
                const isFirst = idx === 0;

                return (
                  <div key={idx} className="relative pl-10">
                    {/* Dot */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm
                      ${isFirst ? evConfig.bg : 'bg-gray-100'}`}>
                      <EvIcon className={`w-3.5 h-3.5 ${isFirst ? evConfig.text : 'text-gray-400'}`} />
                    </div>

                    <div className={`p-3 rounded-xl ${isFirst ? evConfig.bg + ' border border-' + evConfig.color + '-200' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-semibold ${isFirst ? evConfig.text : 'text-gray-700'}`}>
                        {event.note || evConfig.label || event.status}
                      </p>
                      {event.updated_at && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.updated_at)}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {sortedHistory.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada riwayat pergerakan paket</p>
        </div>
      )}
    </div>
  );
}

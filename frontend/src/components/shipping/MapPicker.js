"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// ─── LeafletMap (inner — loads leaflet dynamically) ───────────────────────
function LeafletMapInner({ lat, lng, onLocationSelect }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode using Nominatim (free, no API key)
  const reverseGeocode = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      const displayName = data.display_name || '';
      setAddress(displayName);
      return displayName;
    } catch {
      return '';
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return;
    
    let isMounted = true;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!isMounted) return;
      
      // Fix default icon paths (Next.js issue)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialLat = lat || -6.2088;
      const initialLng = lng || 106.8456;

      // Prevent map container is already initialized error
      if (mapRef.current && mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null; // force clear if exists due to strict mode
      }

      const map = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom pin icon
      const pinIcon = L.divIcon({
        html: `<div style="
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          position: relative;
        ">
          <div style="
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 8px; height: 8px;
            background: white; border-radius: 50%;
          "></div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        className: '',
      });

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      // Drag end → update position
      marker.on('dragend', async (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        const addr = await reverseGeocode(newLat, newLng);
        onLocationSelect?.({ lat: newLat, lng: newLng, address: addr });
      });

      // Click on map → move marker
      map.on('click', async (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        const addr = await reverseGeocode(newLat, newLng);
        onLocationSelect?.({ lat: newLat, lng: newLng, address: addr });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Initial reverse geocode
      reverseGeocode(initialLat, initialLng).then(addr => {
        if (isMounted) onLocationSelect?.({ lat: initialLat, lng: initialLng, address: addr });
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } else if (mapRef.current && mapRef.current._leaflet_id) {
         // Fallback cleanup if the map was somehow initialized but not captured
         mapRef.current._leaflet_id = null;
         mapRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update marker if parent changes lat/lng
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current?.setView([lat, lng], 16);
    }
  }, [lat, lng]);

  return (
    <div className="relative">
      {/* Leaflet CSS */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .leaflet-container { border-radius: 12px; }
      `}</style>

      <div ref={mapRef} style={{ height: '280px', width: '100%', borderRadius: '12px' }} />

      {/* Address display */}
      <div className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-start gap-2 transition-all
        ${isGeocoding ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
        {isGeocoding
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" /> Mendeteksi alamat...</>
          : <><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
              <span className="leading-relaxed">{address || 'Klik atau seret marker untuk menentukan lokasi'}</span>
            </>
        }
      </div>
    </div>
  );
}

// ─── MapPicker wrapper (handles SSR + geolocation button) ─────────────────
export default function MapPicker({ onLocationSelect, defaultLat, defaultLng }) {
  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState({ lat: defaultLat, lng: defaultLng });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const handleLocationSelect = (loc) => {
    setLocation(loc);
    onLocationSelect?.(loc);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolokasi tidak didukung browser ini');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Titik Lokasi Presisi</p>
            <p className="text-xs text-gray-500">Seret pin untuk menyesuaikan lokasi persis</p>
          </div>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {geoLoading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Navigation className="w-3.5 h-3.5" />}
          {geoLoading ? 'Mencari...' : 'Lokasiku'}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{geoError}</p>
      )}

      {mounted ? (
        <LeafletMapInner
          lat={location?.lat}
          lng={location?.lng}
          onLocationSelect={handleLocationSelect}
        />
      ) : (
        <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
    </div>
  );
}

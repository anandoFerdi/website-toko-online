"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ChevronDown, Loader2, Search, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

// ─── Indonesian Administrative Area API (ibnux) ───────────────────────────
const WILAYAH_BASE = 'https://ibnux.github.io/data-indonesia';

async function fetchWilayah(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data wilayah');
  return res.json();
}

// ─── Dropdown component ────────────────────────────────────────────────────
function SelectDropdown({ label, placeholder, options, value, onChange, disabled, loading, searchable = true }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = searchable
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find(o => o.value === value);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="text-sm font-semibold text-gray-700 block">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setOpen(!open); setSearch(''); }}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
              : open ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
              : 'border-gray-300 bg-white hover:border-blue-400 cursor-pointer'}
          `}
        >
          <span className={selected ? 'text-gray-800 font-medium' : 'text-gray-400'}>
            {loading ? (
              <span className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
              </span>
            ) : (selected?.label || placeholder)}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">Tidak ditemukan</p>
              ) : filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2
                    ${value === opt.value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                >
                  {value === opt.value && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AddressForm ──────────────────────────────────────────────────────

export default function AddressForm({ onChange }) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);
  const [district, setDistrict] = useState(null);
  const [village, setVillage] = useState(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [areaId, setAreaId] = useState('');
  const [areaLoading, setAreaLoading] = useState(false);

  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    fetchWilayah(`${WILAYAH_BASE}/provinsi.json`)
      .then(data => setProvinces(data.map(p => ({ value: p.id, label: p.nama }))))
      .catch(console.error);
  }, []);

  // Province → City
  useEffect(() => {
    if (!province) { setCities([]); setCity(null); setDistricts([]); setDistrict(null); setVillages([]); setVillage(null); return; }
    setLoadingCities(true);
    fetchWilayah(`${WILAYAH_BASE}/kabupaten/${province.value}.json`)
      .then(data => setCities(data.map(c => ({ value: c.id, label: c.nama }))))
      .catch(console.error)
      .finally(() => setLoadingCities(false));
    setCity(null); setDistricts([]); setDistrict(null); setVillages([]); setVillage(null);
  }, [province]);

  // City → District
  useEffect(() => {
    if (!city) { setDistricts([]); setDistrict(null); setVillages([]); setVillage(null); return; }
    setLoadingDistricts(true);
    fetchWilayah(`${WILAYAH_BASE}/kecamatan/${city.value}.json`)
      .then(data => setDistricts(data.map(d => ({ value: d.id, label: d.nama }))))
      .catch(console.error)
      .finally(() => setLoadingDistricts(false));
    setDistrict(null); setVillages([]); setVillage(null);
  }, [city]);

  // District → Village
  useEffect(() => {
    if (!district) { setVillages([]); setVillage(null); return; }
    setLoadingVillages(true);
    fetchWilayah(`${WILAYAH_BASE}/kelurahan/${district.value}.json`)
      .then(data => setVillages(data.map(v => ({ value: v.id, label: v.nama }))))
      .catch(console.error)
      .finally(() => setLoadingVillages(false));
    setVillage(null);
  }, [district]);

  // Village selected → search Biteship for area_id
  useEffect(() => {
    if (!village || !city || !district) return;
    setAreaLoading(true);
    
    // Biteship doesn't work well with "Kabupaten" or "Kota" prefixes and sometimes village level is too granular
    const cleanCity = city.label.replace(/Kabupaten |Kota /gi, '').trim();
    const query = `${district.label} ${cleanCity}`;
    
    api.get(`/shipping/areas?query=${encodeURIComponent(query)}`)
      .then(res => {
        const areas = res.data.areas || [];
        if (areas.length > 0) {
          setAreaId(areas[0].id);
          setAreaLoading(false);
        } else {
          // Fallback to just searching the city
          api.get(`/shipping/areas?query=${encodeURIComponent(cleanCity)}`)
            .then(resFallback => {
              const areasFallback = resFallback.data.areas || [];
              if (areasFallback.length > 0) {
                setAreaId(areasFallback[0].id);
              } else {
                setAreaId('');
              }
            })
            .finally(() => setAreaLoading(false));
        }
      })
      .catch((err) => {
        console.error("Gagal mendapatkan area", err);
        setAreaLoading(false);
      });
  }, [village, city, district]);

  // Notify parent when any field changes
  useEffect(() => {
    if (!onChange) return;
    const fullAddress = [streetAddress, village?.label, district?.label, city?.label, province?.label, postalCode]
      .filter(Boolean)
      .join(', ');

    onChange({
      shipping_province: province?.label || '',
      shipping_city: city?.label || '',
      shipping_district: district?.label || '',
      shipping_village: village?.label || '',
      shipping_postal_code: postalCode,
      street_address: streetAddress,
      shipping_address: fullAddress,
      destination_area_id: areaId,
      is_complete: !!(province && city && district && village && streetAddress),
    });
  }, [province, city, district, village, streetAddress, postalCode, areaId]);

  const isComplete = !!(province && city && district && village && streetAddress);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex gap-1.5">
        {[province, city, district, village, streetAddress].map((val, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${val ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Province */}
      <SelectDropdown
        label="Provinsi *"
        placeholder="Pilih provinsi"
        options={provinces}
        value={province?.value}
        onChange={setProvince}
        disabled={provinces.length === 0}
        loading={provinces.length === 0}
      />

      {/* City */}
      <SelectDropdown
        label="Kabupaten / Kota *"
        placeholder={province ? 'Pilih kabupaten/kota' : 'Pilih provinsi terlebih dahulu'}
        options={cities}
        value={city?.value}
        onChange={setCity}
        disabled={!province || loadingCities}
        loading={loadingCities}
      />

      {/* District */}
      <SelectDropdown
        label="Kecamatan *"
        placeholder={city ? 'Pilih kecamatan' : 'Pilih kota terlebih dahulu'}
        options={districts}
        value={district?.value}
        onChange={setDistrict}
        disabled={!city || loadingDistricts}
        loading={loadingDistricts}
      />

      {/* Village */}
      <SelectDropdown
        label="Kelurahan / Desa *"
        placeholder={district ? 'Pilih kelurahan/desa' : 'Pilih kecamatan terlebih dahulu'}
        options={villages}
        value={village?.value}
        onChange={setVillage}
        disabled={!district || loadingVillages}
        loading={loadingVillages}
      />

      {/* Street Address */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 block">
          Nama Jalan &amp; Nomor Rumah *
        </label>
        <input
          type="text"
          value={streetAddress}
          onChange={e => setStreetAddress(e.target.value)}
          placeholder="Contoh: Jl. Merdeka No. 12, RT 03/RW 05"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Postal Code */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 block">Kode Pos</label>
        <input
          type="text"
          value={postalCode}
          onChange={e => setPostalCode(e.target.value)}
          placeholder="12345"
          maxLength={6}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Status indicator */}
      {village && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          areaLoading ? 'bg-yellow-50 text-yellow-700'
          : areaId ? 'bg-green-50 text-green-700'
          : 'bg-orange-50 text-orange-700'
        }`}>
          {areaLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mencocokkan area pengiriman...</>
          ) : areaId ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Area pengiriman terdeteksi — kurir tersedia</>
          ) : (
            <><MapPin className="w-3.5 h-3.5" /> Area tidak terdeteksi, ongkir mungkin tidak tersedia</>
          )}
        </div>
      )}
    </div>
  );
}

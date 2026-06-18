"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  CheckCircle2, ArrowLeft, Truck, ShoppingBag, ShieldCheck, XCircle, Clock,
  MapPin, User, Phone, FileText, ChevronRight, Package, Gift
} from 'lucide-react';
import api from '@/lib/api';
import AddressForm from '@/components/shipping/AddressForm';
import CourierSelector from '@/components/shipping/CourierSelector';

// Dynamic import for MapPicker (SSR-safe)
const MapPicker = dynamic(() => import('@/components/shipping/MapPicker'), { ssr: false });

const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
const MIDTRANS_SNAP_URL   = 'https://app.sandbox.midtrans.com/snap/snap.js';
const FREE_SHIPPING_THRESHOLD = 500000;

// ─── Step Progress Bar ─────────────────────────────────────────────────────
function StepBar({ currentStep }) {
  const steps = ['Informasi Penerima', 'Alamat Pengiriman', 'Pilih Kurir'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
              ${currentStep > i ? 'bg-blue-600 text-white' : currentStep === i ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'}`}>
              {currentStep > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${currentStep >= i ? 'text-blue-700' : 'text-gray-400'}`}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-all ${currentStep > i ? 'bg-blue-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const snapScriptLoaded = useRef(false);

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageStep, setPageStep] = useState('form'); // 'form' | 'success' | 'pending' | 'failed'
  const [formStep, setFormStep] = useState(0); // 0: recipient, 1: address, 2: courier

  const [orderNumber, setOrderNumber] = useState('');

  // Recipient info
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Address data from AddressForm
  const [addressData, setAddressData] = useState({
    shipping_address: '',
    shipping_province: '',
    shipping_city: '',
    shipping_district: '',
    shipping_village: '',
    shipping_postal_code: '',
    destination_area_id: '',
    is_complete: false,
  });

  // Map location
  const [mapLocation, setMapLocation] = useState({ lat: null, lng: null });

  // Selected courier
  const [selectedCourier, setSelectedCourier] = useState(null);

  // Total weight from cart
  const totalWeight = useMemo(() => {
    return cart.items.reduce((sum, item) => {
      return sum + (item.product?.weight || 500) * item.quantity;
    }, 0) || 500;
  }, [cart.items]);

  const subtotal = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity * parseFloat(item.product?.price || 0), 0);
  }, [cart.items]);

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : (selectedCourier?.shipping_cost || 0);
  const total = subtotal + shippingCost;

  // Load Midtrans Snap script
  useEffect(() => {
    if (snapScriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = MIDTRANS_SNAP_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.async = true;
    script.onload = () => { snapScriptLoaded.current = true; };
    document.head.appendChild(script);
  }, []);

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      if (res.data.items.length === 0) { router.push('/cart'); return; }
      setCart(res.data);
    } catch { } finally { setLoading(false); }
  };

  const canProceedStep0 = recipientName.trim() && recipientPhone.trim();
  const canProceedStep1 = addressData.is_complete && addressData.destination_area_id;
  const canProceedStep2 = selectedCourier || isFreeShipping;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        recipient_name:       recipientName,
        recipient_phone:      recipientPhone,
        notes,
        shipping_address:     addressData.shipping_address,
        shipping_province:    addressData.shipping_province,
        shipping_city:        addressData.shipping_city,
        shipping_district:    addressData.shipping_district,
        shipping_village:     addressData.shipping_village,
        shipping_postal_code: addressData.shipping_postal_code,
        destination_area_id:  addressData.destination_area_id,
        shipping_lat:         mapLocation.lat,
        shipping_lng:         mapLocation.lng,
        courier_company:      selectedCourier?.courier_company,
        courier_service:      selectedCourier?.courier_service,
        courier_service_name: selectedCourier?.courier_service_name,
        shipping_cost:        selectedCourier?.shipping_cost || 0,
      };

      const res = await api.post('/orders', payload);

      if (res.status === 201) {
        const { snap_token, order } = res.data;
        setOrderNumber(order.order_number);

        window.snap.pay(snap_token, {
          onSuccess: async (result) => {
            try { await api.post(`/orders/${order.id}/sync-payment`); } catch {}
            setPageStep('success');
          },
          onPending: async (result) => {
            try { await api.post(`/orders/${order.id}/sync-payment`); } catch {}
            setPageStep('pending');
          },
          onError: () => setPageStep('failed'),
          onClose: () => setPageStep('pending'),
        });
      }
    } catch (error) {
      const msg = error?.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-darker border-t-primary" />
      </div>
    );
  }

  // ── Success ──
  if (pageStep === 'success') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
        <div className="card max-w-lg w-full mx-4 p-8 text-center flex flex-col items-center shadow-lg">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Pembayaran Berhasil!</h2>
          <p className="text-text-muted mb-2">No. Pesanan: <span className="font-semibold text-text-main">{orderNumber}</span></p>
          <p className="text-text-muted mb-8 text-sm">
            Pesanan kamu sedang dikemas. Nomor resi akan tersedia setelah paket dikirimkan oleh toko.
          </p>
          <Link href="/products" className="btn-primary w-full max-w-xs mb-4 flex justify-center">Lanjut Belanja</Link>
          <Link href="/" className="text-primary hover:underline font-medium text-sm">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  // ── Pending ──
  if (pageStep === 'pending') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
        <div className="card max-w-lg w-full mx-4 p-8 text-center flex flex-col items-center shadow-lg">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-14 h-14 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Menunggu Pembayaran</h2>
          <p className="text-text-muted mb-2">No. Pesanan: <span className="font-semibold text-text-main">{orderNumber}</span></p>
          <p className="text-text-muted mb-8 text-sm">Segera selesaikan pembayaran sebelum batas waktu habis.</p>
          <Link href="/" className="btn-primary w-full max-w-xs mb-3 flex justify-center">Kembali ke Beranda</Link>
          <Link href="/products" className="text-primary hover:underline font-medium text-sm">Lanjut Belanja</Link>
        </div>
      </div>
    );
  }

  // ── Failed ──
  if (pageStep === 'failed') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
        <div className="card max-w-lg w-full mx-4 p-8 text-center flex flex-col items-center shadow-lg">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-14 h-14 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Pembayaran Gagal</h2>
          <p className="text-text-muted mb-8 text-sm">Terjadi kesalahan saat memproses pembayaran. Silakan coba kembali.</p>
          <Link href="/cart" className="btn-primary w-full max-w-xs mb-3 flex justify-center">Kembali ke Keranjang</Link>
          <Link href="/" className="text-primary hover:underline font-medium text-sm">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white border-b border-border py-6 mb-8">
        <div className="container mx-auto px-4 md:px-8 flex items-center gap-4">
          <Link href="/cart" className="flex items-center text-text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-text-main">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: Steps ── */}
          <div className="flex-1 space-y-6">
            <StepBar currentStep={formStep} />

            {/* ── Step 0: Recipient Info ── */}
            {formStep === 0 && (
              <div className="card p-6 border border-border shadow-sm">
                <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Informasi Penerima
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 block">Nama Penerima *</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Masukkan nama lengkap penerima"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 block">Nomor Telepon *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="08xxxxxxxxxx"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 block">
                      <FileText className="w-4 h-4 inline mr-1" /> Catatan Pesanan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Misal: Patokan rumah warna hijau"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!canProceedStep0}
                    onClick={() => setFormStep(1)}
                    className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lanjut ke Alamat <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Address & Map ── */}
            {formStep === 1 && (
              <div className="space-y-6">
                <div className="card p-6 border border-border shadow-sm">
                  <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Alamat Pengiriman
                  </h2>
                  <AddressForm onChange={setAddressData} />
                </div>

                <div className="card p-6 border border-border shadow-sm">
                  <MapPicker
                    onLocationSelect={(loc) => setMapLocation({ lat: loc.lat, lng: loc.lng })}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStep(0)}
                    className="btn-secondary flex-1"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    disabled={!canProceedStep1}
                    onClick={() => setFormStep(2)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pilih Kurir <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Courier Selection ── */}
            {formStep === 2 && (
              <div className="space-y-6">
                <div className="card p-6 border border-border shadow-sm">
                  <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" /> Pilih Jasa Pengiriman
                  </h2>

                  {isFreeShipping && !addressData.destination_area_id && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                      <Gift className="w-5 h-5 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800 font-medium">
                        🎉 Kamu mendapat <strong>Gratis Ongkir</strong>! Lengkapi alamat untuk memilih kurir.
                      </p>
                    </div>
                  )}

                  <CourierSelector
                    destinationAreaId={addressData.destination_area_id}
                    weight={totalWeight}
                    subtotal={subtotal}
                    onSelect={setSelectedCourier}
                    selectedCourier={selectedCourier}
                  />
                </div>

                {/* Payment method info */}
                <div className="card p-5 border border-border shadow-sm">
                  <h2 className="text-base font-bold text-text-main mb-3">💳 Metode Pembayaran</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-2xl">🏦</div>
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Dibayar via Midtrans</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Pilih VA Bank, E-Wallet, Kartu Kredit, dll. langsung di halaman Midtrans.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormStep(1)} className="btn-secondary flex-1">
                    ← Kembali
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="card p-6 sticky top-28 border border-border shadow-sm">
              <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-text-light" /> Ringkasan Pesanan
              </h3>

              {/* Items */}
              <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-2">
                {cart.items.map(item => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-11 h-11 bg-surface-lighter rounded-lg flex items-center justify-center shrink-0 border border-border">
                      <img
                        src={item.product.image || 'https://placehold.co/100x100/f1f3f5/9ca3af?text=PC'}
                        alt={item.product.name}
                        className="max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-main line-clamp-2 leading-snug text-xs">{item.product.name}</p>
                      <p className="text-text-muted mt-0.5 text-xs">
                        {item.quantity}x Rp {parseInt(item.product.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address summary (if filled) */}
              {addressData.shipping_city && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                  <p className="font-semibold text-blue-800 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Alamat Pengiriman
                  </p>
                  <p className="text-blue-700 leading-relaxed line-clamp-2">{addressData.shipping_address}</p>
                </div>
              )}

              {/* Courier selected */}
              {selectedCourier && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs">
                  <p className="font-semibold text-indigo-800 mb-0.5 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Kurir Dipilih
                  </p>
                  <p className="text-indigo-700">{selectedCourier.courier_service_name}</p>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2.5 pt-4 border-t border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-semibold text-text-main">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Ongkir</span>
                  {isFreeShipping ? (
                    <span className="font-semibold text-success flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" /> Gratis
                    </span>
                  ) : selectedCourier ? (
                    <span className="font-semibold text-text-main">Rp {shippingCost.toLocaleString('id-ID')}</span>
                  ) : (
                    <span className="text-text-muted text-xs">— Pilih kurir</span>
                  )}
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-bold text-text-main">Total Pembayaran</span>
                  <span className="text-xl font-extrabold text-primary">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Submit button — only show on step 2 */}
              {formStep === 2 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceedStep2}
                  className="btn-primary w-full mt-5 py-3 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" /> Menyiapkan...</>
                  ) : '🔒 Lanjut ke Pembayaran'}
                </button>
              )}

              <div className="bg-surface-lighter rounded-lg p-3 mt-4 text-xs text-text-muted flex items-start gap-2 border border-border">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p>Pembayaran diproses aman oleh <strong>Midtrans</strong> &amp; pengiriman via <strong>Biteship</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

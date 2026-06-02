"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, Truck, ShoppingBag, ShieldCheck, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
const MIDTRANS_SNAP_URL   = 'https://app.sandbox.midtrans.com/snap/snap.js';

export default function CheckoutPage() {
  const router = useRouter();
  const snapScriptLoaded = useRef(false);

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success' | 'pending' | 'failed'
  const [orderNumber, setOrderNumber] = useState('');

  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    shipping_address: '',
    notes: '',
  });

  // Load Midtrans Snap script
  useEffect(() => {
    if (snapScriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = MIDTRANS_SNAP_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.async = true;
    script.onload = () => { snapScriptLoaded.current = true; };
    document.head.appendChild(script);
    return () => {
      // Don't remove — snap.js stays in memory across re-renders
    };
  }, []);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      if (res.data.items.length === 0) {
        router.push('/cart');
        return;
      }
      setCart(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.post('/orders', formData);

      if (res.status === 201) {
        const { snap_token, order } = res.data;
        setOrderNumber(order.order_number);

        // Open Midtrans Snap popup
        window.snap.pay(snap_token, {
          onSuccess: async function (result) {
            try { await api.post(`/orders/${order.id}/sync-payment`); } catch(e){}
            console.log('Payment success:', result);
            setStep('success');
          },
          onPending: async function (result) {
            try { await api.post(`/orders/${order.id}/sync-payment`); } catch(e){}
            console.log('Payment pending:', result);
            setStep('pending');
          },
          onError: function (result) {
            console.log('Payment error:', result);
            setStep('failed');
          },
          onClose: function () {
            // User closed the popup without completing payment
            setStep('pending');
          }
        });
      }
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-darker border-t-primary"></div>
      </div>
    );
  }

  // ────── SUCCESS ──────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
        <div className="card max-w-lg w-full mx-4 p-8 text-center flex flex-col items-center shadow-lg">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Pembayaran Berhasil!</h2>
          <p className="text-text-muted mb-2">No. Pesanan: <span className="font-semibold text-text-main">{orderNumber}</span></p>
          <p className="text-text-muted mb-8 text-sm">
            Terima kasih! Pesanan Anda telah kami terima dan sedang diproses. Anda akan mendapatkan notifikasi lebih lanjut via email.
          </p>
          <Link href="/products" className="btn-primary w-full max-w-xs mb-4 flex justify-center">
            Lanjut Belanja
          </Link>
          <Link href="/" className="text-primary hover:underline font-medium text-sm">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // ────── PENDING ──────
  if (step === 'pending') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
        <div className="card max-w-lg w-full mx-4 p-8 text-center flex flex-col items-center shadow-lg">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-14 h-14 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Menunggu Pembayaran</h2>
          <p className="text-text-muted mb-2">No. Pesanan: <span className="font-semibold text-text-main">{orderNumber}</span></p>
          <p className="text-text-muted mb-8 text-sm">
            Pesanan Anda sudah dibuat. Segera selesaikan pembayaran sebelum batas waktu habis. Status pesanan akan diperbarui otomatis setelah pembayaran diterima.
          </p>
          <Link href="/" className="btn-primary w-full max-w-xs mb-3 flex justify-center">
            Kembali ke Beranda
          </Link>
          <Link href="/products" className="text-primary hover:underline font-medium text-sm">
            Lanjut Belanja
          </Link>
        </div>
      </div>
    );
  }

  // ────── FAILED ──────
  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 flex items-center justify-center">
        <div className="card max-w-lg w-full mx-4 p-8 text-center flex flex-col items-center shadow-lg">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-14 h-14 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">Pembayaran Gagal</h2>
          <p className="text-text-muted mb-8 text-sm">
            Terjadi kesalahan saat memproses pembayaran Anda. Silakan coba kembali atau hubungi layanan pelanggan kami.
          </p>
          <Link href="/cart" className="btn-primary w-full max-w-xs mb-3 flex justify-center">
            Kembali ke Keranjang
          </Link>
          <Link href="/" className="text-primary hover:underline font-medium text-sm">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // ────── FORM ──────
  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="bg-white border-b border-border py-6 mb-8">
        <div className="container mx-auto px-4 md:px-8 flex items-center">
          <Link href="/cart" className="flex items-center text-text-muted hover:text-primary transition-colors mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-text-main">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: Form ── */}
          <div className="flex-1 space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="card p-6 border border-border shadow-sm">
                <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" /> Alamat Pengiriman
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-main block">Nama Penerima</label>
                    <input
                      type="text"
                      name="recipient_name"
                      required
                      value={formData.recipient_name}
                      onChange={handleChange}
                      className="w-full bg-surface-lighter border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-main block">Nomor Telepon</label>
                    <input
                      type="tel"
                      name="recipient_phone"
                      required
                      value={formData.recipient_phone}
                      onChange={handleChange}
                      className="w-full bg-surface-lighter border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-text-main block">Alamat Lengkap</label>
                    <textarea
                      name="shipping_address"
                      required
                      rows={3}
                      value={formData.shipping_address}
                      onChange={handleChange}
                      className="w-full bg-surface-lighter border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main resize-none"
                      placeholder="Nama jalan, RT/RW, kelurahan, kecamatan, kota, provinsi, kode pos"
                    ></textarea>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-text-main block">Catatan Pesanan (Opsional)</label>
                    <input
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full bg-surface-lighter border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                      placeholder="Misal: Patokan rumah warna hijau"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="card p-6 border border-border shadow-sm">
                <h2 className="text-lg font-bold text-text-main mb-4">💳 Metode Pembayaran</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="text-2xl">🏦</div>
                  <div>
                    <p className="font-semibold text-blue-900">Dibayar via Midtrans</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Setelah klik tombol "Lanjut ke Pembayaran", Anda akan diarahkan ke halaman pembayaran Midtrans. Pilih metode pembayaran yang Anda inginkan (VA Bank, E-Wallet, Kartu Kredit, dll.) langsung di sana.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* ── Right: Summary ── */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="card p-6 sticky top-28 border border-border shadow-sm">
              <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-text-light" /> Ringkasan Pesanan
              </h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cart.items.map(item => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 bg-surface-lighter rounded flex items-center justify-center shrink-0 border border-border">
                      <img
                        src={item.product.image || `https://placehold.co/100x100/f1f3f5/9ca3af?text=PC`}
                        alt={item.product.name}
                        className="max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-main line-clamp-2 leading-snug">{item.product.name}</p>
                      <p className="text-text-muted mt-1">{item.quantity} x Rp {parseInt(item.product.price).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal Produk</span>
                  <span className="font-semibold text-text-main">Rp {parseInt(cart.total).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Biaya Pengiriman</span>
                  <span className="font-semibold text-success">Gratis</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center mt-2">
                  <span className="font-bold text-text-main">Total Pembayaran</span>
                  <span className="text-xl font-extrabold text-primary">Rp {parseInt(cart.total).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="btn-primary w-full mt-6 py-3 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    Menyiapkan Pembayaran...
                  </>
                ) : (
                  '🔒 Lanjut ke Pembayaran'
                )}
              </button>

              <div className="bg-surface-lighter rounded-lg p-3 mt-4 text-xs text-text-muted flex items-start gap-2 border border-border">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p>Pembayaran Anda diproses secara aman oleh <strong>Midtrans</strong>, gateway pembayaran terpercaya di Indonesia.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

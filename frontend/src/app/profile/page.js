"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  User, LogOut, Package, Clock, CheckCircle2, AlertCircle,
  ShoppingBag, CreditCard, FileDown, Settings, ChevronRight,
  MapPin, Lock, Mail, Trash2, ShoppingCart, Save, Eye, EyeOff,
  X, Star, Truck
} from 'lucide-react';
import api from '@/lib/api';

const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js';

// ── Sidebar menu config ───────────────────────────────────────
const MENU = [
  { id: 'all',       label: 'Semua Pesanan',  icon: ShoppingBag },
  { id: 'pending',   label: 'Belum Dibayar',  icon: Clock       },
  { id: 'paid',      label: 'Dikemas',         icon: Package     },
  { id: 'shipped',   label: 'Dikirim',         icon: Truck       },
  { id: 'cancelled', label: 'Dibatalkan',      icon: AlertCircle },
  { id: 'settings',  label: 'Pengaturan',      icon: Settings    },
];

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => parseInt(n).toLocaleString('id-ID');

const StatusBadge = ({ status }) => {
  const map = {
    pending:    'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped:    'bg-purple-100 text-purple-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
  };
  const labels = {
    pending: 'Pending', processing: 'Diproses', shipped: 'Dikirim',
    delivered: 'Selesai', cancelled: 'Dibatalkan',
  };
  return (
    <span className={`${map[status] || 'bg-gray-100 text-gray-600'} px-2.5 py-1 rounded-full text-xs font-semibold`}>
      {labels[status] || status}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const map = { paid: 'text-green-600', unpaid: 'text-orange-500', refunded: 'text-gray-500' };
  const labels = { paid: 'Lunas', unpaid: 'Belum Bayar', refunded: 'Dikembalikan' };
  return <span className={`text-xs font-semibold ${map[status] || 'text-gray-500'}`}>{labels[status] || status}</span>;
};

// ── Input helper ──────────────────────────────────────────────
const Field = ({ label, type = 'text', value, onChange, placeholder, suffix }) => (
  <div>
    <label className="block text-sm font-medium text-text-main mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
      />
      {suffix && <div className="absolute inset-y-0 right-3 flex items-center">{suffix}</div>}
    </div>
  </div>
);

// ── Alert component ───────────────────────────────────────────
const Alert = ({ type, msg, onClose }) => {
  if (!msg) return null;
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm mb-4 ${styles[type]}`}>
      <span>{msg}</span>
      <button onClick={onClose}><X className="w-4 h-4 shrink-0" /></button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const [user, setUser]       = useState(null);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', role: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const router = useRouter();
  const snapLoaded = useRef(false);

  // ── Load Midtrans script ──────────────────────────────────
  useEffect(() => {
    if (snapLoaded.current) return;
    const s = document.createElement('script');
    s.src = MIDTRANS_SNAP_URL;
    s.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    s.async = true;
    s.onload = () => { snapLoaded.current = true; };
    document.head.appendChild(s);
  }, []);

  // ── Fetch user + orders ────────────────────────────────────
  const loadData = async () => {
    try {
      const [uRes, oRes] = await Promise.all([api.get('/me'), api.get('/orders')]);
      setUser(uRes.data);
      setNewReview(prev => ({...prev, name: uRes.data.name}));
      setOrders(oRes.data.data || oRes.data);
    } catch (err) {
      if (err.response?.status === 401) { Cookies.remove('auth_token'); router.push('/login'); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!Cookies.get('auth_token')) { router.push('/login'); return; }
    loadData();
  }, []);

  // ── Snap pay ──────────────────────────────────────────────
  const payNow = (orderId, token) => {
    if (!token) return alert('Token tidak ditemukan.');
    window.snap.pay(token, {
      onSuccess: async () => {
        try { await api.post(`/orders/${orderId}/sync-payment`); } catch (_) {}
        alert('Pembayaran berhasil!'); loadData();
      },
      onPending: async () => {
        try { await api.post(`/orders/${orderId}/sync-payment`); } catch (_) {}
        loadData();
      },
      onError: () => alert('Pembayaran gagal!'),
      onClose: () => {},
    });
  };

  const cancelOrder = async (id) => {
    if (!confirm('Batalkan pesanan ini?')) return;
    try { await api.post(`/orders/${id}/cancel`); loadData(); }
    catch (e) { alert(e.response?.data?.message || 'Gagal'); }
  };

  const refreshPayment = async (id) => {
    try { const r = await api.post(`/orders/${id}/refresh-payment`); payNow(id, r.data.snap_token); }
    catch (e) { alert(e.response?.data?.message || 'Gagal'); }
  };

  const downloadInvoice = async (id, num) => {
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${num}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { alert('Gagal mengunduh invoice'); }
  };

  const handleLogout = () => { Cookies.remove('auth_token'); window.location.href = '/login'; };

  // ── Filter orders by tab ──────────────────────────────────
  const filteredOrders = () => {
    if (tab === 'all')       return orders;
    if (tab === 'pending')   return orders.filter(o => o.payment_status === 'unpaid' && o.status !== 'cancelled');
    if (tab === 'paid')      return orders.filter(o => o.payment_status === 'paid' && o.status === 'processing');
    if (tab === 'shipped')   return orders.filter(o => o.status === 'shipped' || o.status === 'delivered');
    if (tab === 'cancelled') return orders.filter(o => o.status === 'cancelled');
    return orders;
  };

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-surface-darker border-t-primary" />
    </div>
  );

  if (!user) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="bg-white p-8 rounded-2xl border border-border shadow-card max-w-md w-full">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-text-main mb-2">Gagal Memuat Profil</h2>
        <p className="text-text-muted text-sm mb-6">Terjadi kesalahan koneksi atau data profil tidak dapat diambil. Silakan periksa koneksi Anda dan coba lagi.</p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/')} className="flex-1 btn-secondary py-2.5 text-sm">
            Kembali ke Home
          </button>
          <button onClick={() => window.location.reload()} className="flex-1 btn-primary py-2.5 text-sm shadow-btn-primary">
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ── User header ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-main">{user.name}</h1>
            <p className="text-sm text-text-muted">{user.email}</p>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Star className="w-4 h-4" /> Tambah Ulasan
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Sidebar ── */}
          <aside className="w-full md:w-56 shrink-0">
            <nav className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              {MENU.map((m) => {
                const Icon = m.icon;
                const active = tab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setTab(m.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-b border-border last:border-b-0 ${
                      active
                        ? 'bg-primary/5 text-primary border-l-4 border-l-primary'
                        : 'text-text-muted hover:bg-surface-lighter hover:text-text-main'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {m.label}
                    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {tab !== 'settings' ? (
              <OrdersPanel
                orders={filteredOrders()}
                tabLabel={MENU.find(m => m.id === tab)?.label}
                onPayNow={payNow}
                onCancel={cancelOrder}
                onRefresh={refreshPayment}
                onInvoice={downloadInvoice}
                onShop={() => router.push('/')}
              />
            ) : (
              <SettingsPanel user={user} onUpdated={loadData} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </div>

      {/* ── REVIEW MODAL ── */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-text-main mb-6">Berikan Ulasan Anda</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingReview(true);
              try {
                await api.post('/testimonials', newReview);
                setIsReviewModalOpen(false);
                setNewReview({ ...newReview, role: '', rating: 5, comment: '' });
                alert('Ulasan berhasil dikirim!');
              } catch (error) {
                console.error('Failed to submit review:', error);
                alert('Gagal mengirim ulasan.');
              } finally {
                setIsSubmittingReview(false);
              }
            }} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Nama</label>
                <input 
                  type="text" 
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Nama Anda"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Peran / Pekerjaan (Opsional)</label>
                <input 
                  type="text" 
                  value={newReview.role}
                  onChange={(e) => setNewReview({...newReview, role: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Misal: Gamer, Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${newReview.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Komentar</label>
                <textarea 
                  required
                  rows="4"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Ceritakan pengalaman Anda berbelanja di sini..."
                ></textarea>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmittingReview}
                  className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                >
                  {isSubmittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ORDERS PANEL
// ═══════════════════════════════════════════════════════════════
function OrdersPanel({ orders, tabLabel, onPayNow, onCancel, onRefresh, onInvoice, onShop }) {
  if (orders.length === 0) return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-surface-lighter rounded-full flex items-center justify-center mb-4">
        <ShoppingCart className="w-8 h-8 text-text-light" />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2">Tidak ada pesanan</h3>
      <p className="text-text-muted text-sm mb-6">Belum ada pesanan pada kategori "{tabLabel}"</p>
      <button onClick={onShop} className="btn-primary">Mulai Belanja</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
          {/* Card header */}
          <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-border bg-surface-lighter/50">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-text-main text-sm">{order.order_number}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-text-muted">
              {new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {/* Items */}
          <div className="px-5 py-4 space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex gap-3 text-sm">
                <div className="w-11 h-11 bg-surface-lighter rounded-lg flex items-center justify-center shrink-0 border border-border p-1">
                  {item.product?.image
                    ? <img src={item.product.image} alt={item.product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    : <Package className="w-5 h-5 text-text-light" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-main line-clamp-1">{item.product?.name || 'Produk dihapus'}</p>
                  <p className="text-text-muted text-xs mt-0.5">{item.quantity} × Rp {fmt(item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-3.5 border-t border-border">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Total Pembayaran</p>
              <p className="font-bold text-primary">Rp {fmt(order.total_price)}</p>
              <PaymentBadge status={order.payment_status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => onCancel(order.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Batalkan
                  </button>
                  <button
                    onClick={() => onPayNow(order.id, order.midtrans_token)}
                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Bayar Sekarang
                  </button>
                </>
              )}
              {order.status === 'cancelled' && order.payment_status === 'unpaid' && (
                <button
                  onClick={() => onRefresh(order.id)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Perbarui Pembayaran
                </button>
              )}
              {order.payment_status === 'paid' && (
                <button
                  onClick={() => onInvoice(order.id, order.order_number)}
                  className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" /> Invoice PDF
                </button>
              )}
              {order.biteship_waybill_id && (
                <a
                  href={`/tracking?waybill_id=${order.biteship_waybill_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" /> Lacak Paket
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════
function SettingsPanel({ user, onUpdated, onLogout }) {
  const [section, setSection] = useState('profile');
  const [alert, setAlert]     = useState({ type: '', msg: '' });
  const clearAlert = () => setAlert({ type: '', msg: '' });

  const sections = [
    { id: 'profile',  label: 'Informasi Profil',   icon: User   },
    { id: 'address',  label: 'Alamat Pengiriman',   icon: MapPin },
    { id: 'email',    label: 'Ganti Email',          icon: Mail   },
    { id: 'password', label: 'Ganti Kata Sandi',     icon: Lock   },
    { id: 'danger',   label: 'Hapus Akun',           icon: Trash2 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex border-b border-border overflow-x-auto">
        {sections.map(s => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setSection(s.id); clearAlert(); }}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'
              } ${s.id === 'danger' ? 'text-red-500 hover:text-red-600' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        <Alert type={alert.type} msg={alert.msg} onClose={clearAlert} />

        {section === 'profile'  && <ProfileSection  user={user} setAlert={setAlert} onUpdated={onUpdated} />}
        {section === 'address'  && <AddressSection  user={user} setAlert={setAlert} onUpdated={onUpdated} />}
        {section === 'email'    && <EmailSection    setAlert={setAlert} onUpdated={onUpdated} />}
        {section === 'password' && <PasswordSection setAlert={setAlert} />}
        {section === 'danger'   && <DangerSection   setAlert={setAlert} onLogout={onLogout} />}
      </div>
    </div>
  );
}

// ── Profile section ───────────────────────────────────────────
function ProfileSection({ user, setAlert, onUpdated }) {
  const [name,  setName]  = useState(user.name  || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [busy,  setBusy]  = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/me', { name, phone, address: user.address });
      setAlert({ type: 'success', msg: 'Profil berhasil diperbarui!' });
      onUpdated();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Gagal memperbarui profil.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="text-base font-bold text-text-main">Informasi Profil</h3>
      <Field label="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Lengkap" />
      <Field label="Nomor Telepon" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62..." />
      <div>
        <label className="block text-sm font-medium text-text-main mb-1.5">Email</label>
        <input disabled value={user.email} className="w-full bg-surface-lighter/60 border border-border rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed" />
        <p className="text-xs text-text-light mt-1">Untuk mengubah email, gunakan tab "Ganti Email"</p>
      </div>
      <button onClick={save} disabled={busy} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </div>
  );
}

// ── Address section ───────────────────────────────────────────
function AddressSection({ user, setAlert, onUpdated }) {
  const [address, setAddress] = useState(user.address || '');
  const [busy, setBusy]       = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/me', { name: user.name, phone: user.phone, address });
      setAlert({ type: 'success', msg: 'Alamat berhasil disimpan!' });
      onUpdated();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Gagal menyimpan alamat.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h3 className="text-base font-bold text-text-main">Alamat Pengiriman Default</h3>
        <p className="text-sm text-text-muted mt-1">
          Opsional — Anda tetap bisa mengisi alamat saat checkout. Alamat ini akan menjadi nilai awal formulir checkout.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-main mb-1.5">Alamat Lengkap</label>
        <textarea
          rows={4}
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Jl. Contoh No. 123, Kota, Provinsi, Kode Pos"
          className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
        />
      </div>
      <button onClick={save} disabled={busy} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" /> {busy ? 'Menyimpan...' : 'Simpan Alamat'}
      </button>
    </div>
  );
}

// ── Email section ─────────────────────────────────────────────
function EmailSection({ setAlert, onUpdated }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/me/email', { email, password });
      setAlert({ type: 'success', msg: 'Email berhasil diperbarui!' });
      setEmail(''); setPassword('');
      onUpdated();
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Gagal memperbarui email.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="text-base font-bold text-text-main">Ganti Email</h3>
      <Field label="Email Baru" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@baru.com" />
      <Field
        label="Konfirmasi dengan Kata Sandi"
        type={show ? 'text' : 'password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Kata sandi saat ini"
        suffix={
          <button type="button" onClick={() => setShow(!show)} className="text-text-muted hover:text-text-main">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      <button onClick={save} disabled={busy} className="btn-primary flex items-center gap-2">
        <Mail className="w-4 h-4" /> {busy ? 'Memperbarui...' : 'Perbarui Email'}
      </button>
    </div>
  );
}

// ── Password section ──────────────────────────────────────────
function PasswordSection({ setAlert }) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showAll,  setShowAll]  = useState(false);
  const [busy,     setBusy]     = useState(false);

  const save = async () => {
    if (next !== confirm) { setAlert({ type: 'error', msg: 'Konfirmasi kata sandi tidak sesuai.' }); return; }
    setBusy(true);
    try {
      await api.put('/me/password', {
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      setAlert({ type: 'success', msg: 'Kata sandi berhasil diperbarui!' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Gagal memperbarui kata sandi.' });
    } finally { setBusy(false); }
  };

  const eyeBtn = (
    <button type="button" onClick={() => setShowAll(!showAll)} className="text-text-muted hover:text-text-main">
      {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="text-base font-bold text-text-main">Ganti Kata Sandi</h3>
      <Field label="Kata Sandi Saat Ini" type={showAll ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" suffix={eyeBtn} />
      <Field label="Kata Sandi Baru" type={showAll ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} placeholder="Min. 8 karakter" suffix={eyeBtn} />
      <Field label="Konfirmasi Kata Sandi Baru" type={showAll ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi kata sandi baru" suffix={eyeBtn} />
      <button onClick={save} disabled={busy} className="btn-primary flex items-center gap-2">
        <Lock className="w-4 h-4" /> {busy ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
      </button>
    </div>
  );
}

// ── Danger section ────────────────────────────────────────────
function DangerSection({ setAlert, onLogout }) {
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [confirm,  setConfirm]  = useState(false);
  const [busy,     setBusy]     = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.delete('/me', { data: { password } });
      Cookies.remove('auth_token');
      window.location.href = '/';
    } catch (e) {
      setAlert({ type: 'error', msg: e.response?.data?.message || 'Gagal menghapus akun.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-base font-bold text-red-700 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Hapus Akun</h3>
        <p className="text-sm text-red-600 mt-2">
          Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua data Anda termasuk riwayat pesanan akan dihapus secara permanen.
        </p>
      </div>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl text-sm font-semibold transition-colors"
        >
          Saya ingin menghapus akun saya
        </button>
      ) : (
        <div className="space-y-4">
          <Field
            label="Konfirmasi dengan Kata Sandi"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Kata sandi Anda"
            suffix={
              <button type="button" onClick={() => setShow(!show)} className="text-text-muted hover:text-text-main">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <div className="flex gap-3">
            <button onClick={() => setConfirm(false)} className="px-4 py-2.5 bg-surface-lighter text-text-muted hover:bg-border rounded-xl text-sm font-semibold transition-colors">
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={busy || !password}
              className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> {busy ? 'Menghapus...' : 'Hapus Akun Selamanya'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

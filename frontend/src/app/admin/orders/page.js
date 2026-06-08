"use client";

import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Eye, X, CheckCircle2, Clock, Package, AlertCircle, Printer, Truck, MapPin, Edit } from 'lucide-react';
import api from '@/lib/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', payment_status: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      // Assuming paginated response
      setOrders(res.data.data || res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.recipient_name.toLowerCase().includes(search.toLowerCase())
  );

  const openDetailModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({ 
      status: order.status, 
      payment_status: order.payment_status 
    });
    setIsModalOpen(true);
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({ 
      status: order.status, 
      payment_status: order.payment_status 
    });
    setIsStatusModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (!isStatusModalOpen) setSelectedOrder(null);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    if (!isModalOpen) setSelectedOrder(null);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setIsSubmitting(true);
    try {
      await api.put(`/admin/orders/${selectedOrder.id}/status`, statusForm);
      setIsModalOpen(false);
      setIsStatusModalOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      alert("Gagal mengupdate status pesanan.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (!selectedOrder?.biteship_order_id) return;
    try {
      const res = await api.get(`/admin/orders/${selectedOrder.id}/label`, { responseType: 'text' });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      win.focus();
    } catch (error) {
      alert("Gagal mendownload label. Pastikan resi sudah terbuat.");
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
      case 'processing': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Package className="w-3 h-3" /> Diproses</span>;
      case 'shipped': return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium w-fit">Dikirim</span>;
      case 'delivered': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Selesai</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Dibatalkan</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium w-fit">{status}</span>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'paid': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium w-fit">Lunas</span>;
      case 'unpaid': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium w-fit">Belum Bayar</span>;
      case 'refunded': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium w-fit">Dikembalikan</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium w-fit">{status}</span>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Manajemen Pesanan
          </h1>
          <p className="text-text-muted mt-1">Pantau dan kelola pesanan pelanggan.</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari ID Pesanan / Nama..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-text-muted font-medium">
            Total: {filteredOrders.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">ID Pesanan</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Total Harga</th>
                <th className="px-6 py-4">Pembayaran</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-surface-darker border-t-primary"></div></div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main">{order.order_number}</td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-main">{order.recipient_name}</div>
                      <div className="text-xs text-text-muted">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      Rp {parseInt(order.total_price).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">{getPaymentBadge(order.payment_status)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => openStatusModal(order)}
                        className="py-1.5 px-3 text-xs flex items-center gap-1 font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Status
                      </button>
                      <button 
                        onClick={() => openDetailModal(order)}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-text-muted">
                    Pesanan tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Update Status Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto py-12">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
              <h2 className="font-bold text-lg text-text-main flex items-center gap-2">
                Detail Pesanan <span className="text-primary">{selectedOrder.order_number}</span>
              </h2>
              <button onClick={closeModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Order Info */}
              <div className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Informasi Pelanggan</h3>
                    <div className="bg-surface-lighter p-4 rounded-lg border border-border space-y-2 text-sm">
                      <p><span className="text-text-muted">Nama:</span> <span className="font-medium text-text-main">{selectedOrder.recipient_name}</span></p>
                      <p><span className="text-text-muted">Telepon:</span> <span className="font-medium text-text-main">{selectedOrder.recipient_phone}</span></p>
                      <p><span className="text-text-muted">Email:</span> <span className="font-medium text-text-main">{selectedOrder.user?.email}</span></p>
                      <div className="pt-2 mt-2 border-t border-border">
                        <span className="text-text-muted block mb-1">Alamat Pengiriman:</span>
                        <p className="font-medium text-text-main leading-relaxed">{selectedOrder.shipping_address}</p>
                      </div>
                      {selectedOrder.notes && (
                        <div className="pt-2 mt-2 border-t border-border">
                          <span className="text-text-muted block mb-1">Catatan:</span>
                          <p className="font-medium text-text-main italic">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center justify-between">
                      Informasi Pengiriman
                      {selectedOrder.biteship_order_id && (
                        <button 
                          onClick={handleDownloadLabel}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded"
                        >
                          <Printer className="w-3 h-3" /> Cetak Label
                        </button>
                      )}
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2 text-sm">
                      <p><span className="text-blue-700">Kurir:</span> <span className="font-medium text-blue-900">{selectedOrder.courier_service_name || '-'}</span></p>
                      <p><span className="text-blue-700">No. Resi:</span> <span className="font-mono font-bold text-blue-900">{selectedOrder.biteship_waybill_id || '-'}</span></p>
                      {!selectedOrder.biteship_waybill_id && (
                        <p className="text-xs text-orange-600 italic mt-2">Resi akan dibuat otomatis saat status diubah menjadi "Dikirim".</p>
                      )}
                      {selectedOrder.biteship_waybill_id && (
                        <a 
                          href={`/tracking?waybill_id=${selectedOrder.biteship_waybill_id}`} 
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 font-medium"
                        >
                          <MapPin className="w-3 h-3" /> Lacak Paket
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Update Status</h3>
                  <form onSubmit={handleUpdateStatus} className="bg-white p-4 rounded-lg border border-border shadow-sm space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-main block">Status Pembayaran</label>
                      <select 
                        value={statusForm.payment_status}
                        onChange={(e) => setStatusForm({...statusForm, payment_status: e.target.value})}
                        className="w-full bg-surface-lighter border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="unpaid">Belum Bayar (Unpaid)</option>
                        <option value="paid">Lunas (Paid)</option>
                        <option value="refunded">Dikembalikan (Refunded)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-main block">Status Pesanan</label>
                      <select 
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                        className="w-full bg-surface-lighter border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Diproses (Processing)</option>
                        <option value="shipped">Dikirim (Shipped)</option>
                        <option value="delivered">Selesai (Delivered)</option>
                        <option value="cancelled">Dibatalkan (Cancelled)</option>
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn-primary w-full mt-2"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Update Status'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex justify-between">
                  <span>Daftar Item</span>
                  <span>Rp {parseInt(selectedOrder.total_price).toLocaleString('id-ID')}</span>
                </h3>
                <div className="bg-surface-lighter rounded-lg border border-border overflow-hidden">
                  <div className="max-h-[350px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex gap-3 text-sm bg-white p-3 rounded border border-border shadow-sm">
                        <div className="w-12 h-12 bg-surface-lighter rounded flex items-center justify-center shrink-0 border border-border p-1">
                          {item.product?.image ? (
                            <img src={item.product.image} alt={item.product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                          ) : (
                            <Package className="w-5 h-5 text-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-main line-clamp-2 leading-snug mb-1">{item.product?.name || 'Produk Dihapus'}</p>
                          <div className="flex justify-between items-center text-text-muted">
                            <span>{item.quantity} x Rp {parseInt(item.price).toLocaleString('id-ID')}</span>
                            <span className="font-bold text-text-main">Rp {parseInt(item.subtotal).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border bg-white flex justify-between items-center">
                    <span className="font-bold text-text-main">Total Pembayaran</span>
                    <span className="text-lg font-extrabold text-primary">Rp {parseInt(selectedOrder.total_price).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Separate Update Status Modal */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
              <h2 className="font-bold text-lg text-text-main">
                Update Status
              </h2>
              <button onClick={closeStatusModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Status Pembayaran</label>
                <select 
                  value={statusForm.payment_status}
                  onChange={(e) => setStatusForm({...statusForm, payment_status: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="unpaid">Belum Bayar (Unpaid)</option>
                  <option value="paid">Lunas (Paid)</option>
                  <option value="refunded">Dikembalikan (Refunded)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Status Pesanan</label>
                <select 
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Diproses (Processing)</option>
                  <option value="shipped">Dikirim (Shipped)</option>
                  <option value="delivered">Selesai (Delivered)</option>
                  <option value="cancelled">Dibatalkan (Cancelled)</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeStatusModal}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-text-muted hover:bg-surface-lighter transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 btn-primary"
                >
                  {isSubmitting ? '...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

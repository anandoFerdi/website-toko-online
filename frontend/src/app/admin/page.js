"use client";

import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    total_products: 0,
    total_customers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, there would be a dedicated dashboard stats endpoint.
      // For now, we'll fetch orders and calculate stats basic info.
      const [ordersRes, productsRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/products') // Assuming paginated, just getting total count from meta later if possible
      ]);

      const orders = ordersRes.data.data || [];
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + parseInt(order.total_price), 0);

      setStats({
        total_orders: ordersRes.data.total || orders.length,
        total_revenue: totalRevenue,
        total_products: productsRes.data.total || 0,
        total_customers: 0, // Placeholder
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col items-center text-center gap-3 min-h-[160px]">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
        <h3 className="text-xl font-bold text-text-main">{value}</h3>
        {trend && (
          <p className="text-xs text-success flex items-center justify-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
    </div>
  );

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

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-surface-darker border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-main mb-1">Dashboard Overview</h1>
        <p className="text-text-muted">Ringkasan performa toko Anda hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${stats.total_revenue.toLocaleString('id-ID')}`}
          icon={DollarSign}
          colorClass="bg-green-50 text-green-600"
          trend="+12.5% dari bulan lalu"
        />
        <StatCard
          title="Total Pesanan"
          value={stats.total_orders}
          icon={ShoppingCart}
          colorClass="bg-blue-50 text-blue-600"
          trend="+5 pesanan baru hari ini"
        />
        <StatCard
          title="Total Produk"
          value={stats.total_products}
          icon={Package}
          colorClass="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="Total Pelanggan"
          value={stats.total_customers || 12}
          icon={Users}
          colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="w-full">
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-text-main">Pesanan Terbaru</h2>
              <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
                  <tr>
                    <th className="px-3 py-4">ID Pesanan</th>
                    <th className="px-3 py-4">Pelanggan</th>
                    <th className="px-3 py-4">Total</th>
                    <th className="px-3 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-lighter/50 transition-colors">
                        <td className="px-3 py-4 font-medium text-text-main">{order.order_number}</td>
                        <td className="px-3 py-4 text-text-muted">{order.recipient_name}</td>
                        <td className="px-3 py-4 font-medium">Rp {parseInt(order.total_price).toLocaleString('id-ID')}</td>
                        <td className="px-3 py-4">{getStatusBadge(order.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-text-muted">
                        Belum ada pesanan terbaru
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-white border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-text-main mb-4">Aktivitas Toko</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {recentOrders.slice(0, 3).map((order, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface-lighter text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-border bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-text-main text-sm">Pesanan Baru</div>
                      <time className="text-xs font-medium text-text-muted">Hari ini</time>
                    </div>
                    <div className="text-text-muted text-xs leading-snug">
                      {order.recipient_name} membuat pesanan {order.order_number} senilai Rp {parseInt(order.total_price).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

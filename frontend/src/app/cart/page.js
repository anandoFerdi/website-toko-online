"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, Package, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity });
      fetchCart();
    } catch (error) {
      alert("Gagal mengupdate kuantitas");
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      fetchCart();
    } catch (error) {
      alert("Gagal menghapus item");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white border-b border-border py-8 mb-8">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-3xl font-extrabold text-text-main flex items-center gap-3">
            <ShoppingBag className="text-primary w-8 h-8" /> Keranjang Belanja
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-surface-darker border-t-primary"></div>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="card p-16 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-8">
            <div className="w-24 h-24 bg-surface-lighter rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-text-light" />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-3">Keranjang Anda Masih Kosong</h2>
            <p className="text-text-muted mb-8 max-w-md">
              Sepertinya Anda belum menambahkan komponen PC apapun. Mari temukan komponen impian Anda sekarang.
            </p>
            <Link href="/products" className="btn-primary flex items-center gap-2">
              Mulai Belanja <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-surface-lighter text-xs font-bold text-text-muted uppercase tracking-wider">
                  <div className="col-span-6">Produk</div>
                  <div className="col-span-3 text-center">Kuantitas</div>
                  <div className="col-span-3 text-right">Total Harga</div>
                </div>

                <div className="divide-y divide-border">
                  {cart.items.map((item) => (
                    <div key={item.id} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      
                      {/* Product Info */}
                      <div className="col-span-1 md:col-span-6 flex items-start gap-4">
                        <div className="w-20 h-20 bg-surface-lighter rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
                          <img 
                            src={item.product.image || `https://placehold.co/300x200/f1f3f5/9ca3af?text=${encodeURIComponent(item.product.name?.split(' ')[0] || 'Produk')}`} 
                            alt={item.product.name} 
                            className="max-h-full object-contain mix-blend-multiply" 
                          />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <Link href={`/products/${item.product.id}`} className="font-semibold text-text-main hover:text-primary transition-colors line-clamp-2 mb-1">
                            {item.product.name}
                          </Link>
                          <div className="text-xs text-text-muted bg-surface-lighter inline-block px-2 py-0.5 rounded border border-border mb-2">
                            {item.product.brand?.name}
                          </div>
                          <div className="font-bold text-primary text-sm md:hidden">
                            Rp {parseInt(item.product.price).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="col-span-1 md:col-span-3 flex justify-between md:justify-center items-center">
                        <span className="text-sm font-medium text-text-muted md:hidden">Jumlah:</span>
                        <div className="flex items-center">
                          <div className="flex items-center bg-white border border-border rounded-lg shadow-sm">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary hover:bg-surface-lighter transition-colors rounded-l-lg"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-bold text-text-main border-x border-border h-8 flex items-center justify-center bg-surface-lighter/50">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary hover:bg-surface-lighter transition-colors rounded-r-lg"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            onClick={() => removeItem(item.id)} 
                            className="ml-4 p-2 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:hidden"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="col-span-1 md:col-span-3 flex justify-end items-center gap-4">
                        <div className="font-bold text-text-main hidden md:block">
                          Rp {(item.quantity * parseInt(item.product.price)).toLocaleString('id-ID')}
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)} 
                          className="p-2 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors hidden md:flex"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[340px] shrink-0">
              <div className="card p-6 sticky top-28">
                <h3 className="text-lg font-bold text-text-main mb-4">Ringkasan Belanja</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Total Harga ({cart.items.reduce((acc, curr) => acc + curr.quantity, 0)} barang)</span>
                    <span className="font-semibold text-text-main">Rp {parseInt(cart.total).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Total Diskon</span>
                    <span className="font-semibold text-success">- Rp 0</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-text-main">Total Belanja</span>
                    <span className="text-xl font-extrabold text-primary">Rp {parseInt(cart.total).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <Link href="/checkout" className="btn-primary w-full flex justify-center items-center gap-2 mb-4">
                  Beli Sekarang ({cart.items.reduce((acc, curr) => acc + curr.quantity, 0)})
                </Link>

                <div className="bg-surface-lighter rounded-lg p-3 text-xs text-text-muted flex items-start gap-2 border border-border">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <p>Transaksi 100% aman dan dilindungi asuransi pengiriman.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, AlertTriangle, ArrowLeft, Cpu, Bot, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ProductDetailPage({ params }) {
  const { id } = React.use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Gagal memuat produk. Produk mungkin tidak tersedia.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await api.post('/cart', { product_id: product.id, quantity });
      alert('Produk berhasil ditambahkan ke keranjang!');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Silakan login terlebih dahulu untuk menambahkan produk ke keranjang.');
      } else {
        alert('Gagal menambahkan ke keranjang.');
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex gap-4 items-center mb-8 skeleton h-6 w-32 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="skeleton h-96 rounded-xl" />
          <div className="space-y-6">
            <div className="skeleton h-4 rounded w-1/4" />
            <div className="skeleton h-10 rounded w-3/4" />
            <div className="skeleton h-6 rounded w-1/3" />
            <div className="skeleton h-24 rounded" />
            <div className="skeleton h-12 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-main mb-2">Terjadi Kesalahan</h2>
        <p className="text-text-muted mb-6">{error || "Produk tidak ditemukan."}</p>
        <Link href="/products" className="btn-primary py-2 px-6">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  // Calculate mock original price for promo styling
  const isPromo = product.id % 3 === 0; // Simulate promo for 1/3 of products
  const discountPercentage = isPromo ? 15 : null;
  const originalPrice = isPromo ? Math.round(parseInt(product.price) * 1.15) : null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 md:px-8">

        {/* Back navigation */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Katalog
        </Link>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white card p-6 md:p-8 border border-border shadow-card mb-8">

          {/* Image gallery */}
          <div className="flex flex-col items-center justify-center bg-surface-lighter rounded-2xl p-8 relative h-[350px] md:h-[450px]">
            <img
              src={product.image || `https://placehold.co/500x400/f1f3f5/9ca3af?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
            {product.is_trending && (
              <div className="absolute top-4 left-4 badge bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-3 py-1 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" /> Best Seller
              </div>
            )}
            {isPromo && (
              <div className="absolute top-4 right-4 bg-red-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Product info details */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category?.name}
              </span>
              <span className="text-xs font-semibold text-text-muted">
                Brand: <span className="text-text-main font-bold">{product.brand?.name}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-text-main leading-tight mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-0.5 text-yellow-500 text-sm font-bold">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
                <span className="ml-1 text-text-main">{product.rating || '4.8'}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <span className="text-xs text-text-muted font-medium">120+ Terjual</span>
            </div>

            {/* Pricing Details */}
            <div className="bg-surface-lighter rounded-xl p-4 md:p-5 mb-6 flex flex-col gap-1 border border-border/50">
              {originalPrice && (
                <span className="text-sm text-text-muted line-through font-semibold">
                  Rp {originalPrice.toLocaleString('id-ID')}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-extrabold text-text-main">
                  Rp {parseInt(product.price).toLocaleString('id-ID')}
                </span>
                {isPromo && (
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">
                    Hemat {discountPercentage}%
                  </span>
                )}
              </div>
              <div className="h-px bg-border my-2.5" />

              {/* Stock status */}
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {product.stock > 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>Stok Ready ({product.stock} unit)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-500">
                    <AlertTriangle className="w-4.5 h-4.5" />
                    <span>Stok Habis</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product short description */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider mb-2">Deskripsi Produk</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                {product.description || `Komponen PC premium ${product.name} dirancang khusus untuk performa komputasi terbaik, efisiensi termal tinggi, dan kompatibilitas sistem optimal.`}
              </p>
            </div>

            {/* Quantity Selector & Action Button */}
            {product.stock > 0 ? (
              <div className="mt-auto flex flex-wrap gap-4 items-center pt-6 border-t border-border">
                <div className="flex items-center border border-border rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 text-text-muted hover:bg-surface-lighter hover:text-text-main transition-colors font-bold text-lg"
                  >
                    -
                  </button>
                  <span className="px-5 py-2 font-extrabold text-text-main text-sm w-14 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3.5 py-2 text-text-muted hover:bg-surface-lighter hover:text-text-main transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 font-bold shadow-btn-primary min-w-[200px]"
                >
                  <ShoppingCart className="w-5 h-5" /> {adding ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                </button>
              </div>
            ) : (
              <div className="mt-auto pt-6 border-t border-border">
                <button
                  disabled
                  className="w-full bg-surface-lighter text-text-light border border-border py-3 rounded-lg font-bold cursor-not-allowed text-center"
                >
                  Stok Habis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Specifications & AI Box Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Specs Details */}
          <div className="lg:col-span-2 bg-white card p-6 md:p-8 border border-border shadow-card">
            <h2 className="text-xl font-bold text-text-main mb-5 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Spesifikasi Teknis
            </h2>

            <div className="overflow-hidden border border-border rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <tbody className="bg-white divide-y divide-border text-sm">
                  {product.specs ? (() => {
                    try {
                      // 1. Parsing string JSON menjadi Object asli secara aman
                      const specObject = typeof product.specs === 'string'
                        ? JSON.parse(product.specs)
                        : product.specs;

                      // 2. Cek apakah objek hasil parsing memiliki data di dalamnya
                      if (specObject && Object.keys(specObject).length > 0) {
                        return Object.entries(specObject).map(([key, value], idx) => (
                          <tr key={key} className={idx % 2 === 0 ? 'bg-surface-lighter/40' : 'bg-white'}>
                            <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border capitalize">
                              {key.replace(/_/g, ' ')}
                            </td>
                            <td className="px-5 py-3 text-text-muted">
                              {Array.isArray(value)
                                ? value.join(', ')
                                : typeof value === 'object' && value !== null
                                  ? JSON.stringify(value)
                                  : String(value)}
                            </td>
                          </tr>
                        ));
                      }
                    } catch (e) {
                      console.error("Gagal melakukan parsing JSON pada product.specs:", e);
                    }

                    // 3. Jika data specs kosong atau gagal di-parse, tampilkan data default (fallback)
                    return (
                      <>
                        <tr className="bg-surface-lighter/40">
                          <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Brand</td>
                          <td className="px-5 py-3 text-text-muted">{product.brand?.name}</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Kategori</td>
                          <td className="px-5 py-3 text-text-muted">{product.category?.name}</td>
                        </tr>
                        <tr className="bg-surface-lighter/40">
                          <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Garansi</td>
                          <td className="px-5 py-3 text-text-muted">3 Tahun Resmi</td>
                        </tr>
                        <tr>
                          <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Kondisi</td>
                          <td className="px-5 py-3 text-text-muted">Baru & Original</td>
                        </tr>
                      </>
                    );
                  })() : (
                    // 4. Kondisi jika product.specs bernilai null atau undefined sejak awal
                    <>
                      <tr className="bg-surface-lighter/40">
                        <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Brand</td>
                        <td className="px-5 py-3 text-text-muted">{product.brand?.name}</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Kategori</td>
                        <td className="px-5 py-3 text-text-muted">{product.category?.name}</td>
                      </tr>
                      <tr className="bg-surface-lighter/40">
                        <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Garansi</td>
                        <td className="px-5 py-3 text-text-muted">3 Tahun Resmi</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 font-bold text-text-main w-1/3 bg-surface-lighter/20 border-r border-border">Kondisi</td>
                        <td className="px-5 py-3 text-text-muted">Baru & Original</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Helper Banner Panel */}
          <div className="bg-gradient-to-br from-secondary-light/20 via-white to-primary-light/20 border border-secondary/20 card p-6 md:p-8 shadow-card flex flex-col">
            <div className="ai-tag inline-flex items-center gap-1.5 self-start mb-4">
              <Bot className="w-3.5 h-3.5" /> Asisten AI Komponen
            </div>

            <h3 className="text-lg font-bold text-text-main mb-3 leading-snug">
              Bingung Apakah Komponen Ini Cocok Untuk PC Anda?
            </h3>

            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Tanyakan asisten AI kami! AI kami dapat menganalisis kompatibilitas komponen ini dengan spesifikasi PC Anda saat ini, atau memberikan rekomendasi upgrade terbaik.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-2.5 text-xs font-semibold text-text-main">
                <div className="w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <span>Analisis kecocokan soket & daya (watt) secara instan.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs font-semibold text-text-main">
                <div className="w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <span>Rekomendasi kombinasi motherboard & RAM yang cocok.</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                href="/ai-builder"
                className="w-full btn-secondary text-center py-2.5 border-secondary/40 text-secondary hover:bg-secondary-light flex items-center justify-center gap-2 text-sm"
              >
                <Bot className="w-4 h-4" /> Coba AI PC Builder
              </Link>
              <Link
                href="/compatibility"
                className="w-full btn-primary text-center py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4" /> Cek Kompatibilitas
              </Link>
            </div>
          </div>

        </div>

        {/* Benefits & Trust badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-light text-primary rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-text-main text-sm">Garansi Resmi 100%</h4>
              <p className="text-xs text-text-muted">Semua komponen dijamin original dan bergaransi resmi.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-light text-primary rounded-xl"><Truck className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-text-main text-sm">Pengiriman Aman & Cepat</h4>
              <p className="text-xs text-text-muted">Proteksi busa tebal & asuransi penuh untuk setiap kiriman.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-light text-primary rounded-xl"><RotateCcw className="w-6 h-6" /></div>
            <div>
              <h4 className="font-bold text-text-main text-sm">Kemudahan Retur</h4>
              <p className="text-xs text-text-muted">Komplain mudah & retur barang jika rusak dalam pengiriman.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

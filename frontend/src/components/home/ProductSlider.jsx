"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Play, Pause, ChevronLeft, ChevronRight, Zap, Flame, Award } from 'lucide-react';
import api from '@/lib/api';

export default function ProductSlider({ title, type = 'terlaris', products: initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState('left'); // 'left' atau 'right'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const scrollRef = useRef(null);
  const isUserInteracting = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const userScrollTimeout = useRef(null);

  // Custom toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        let url = '/products?per_page=10';
        if (type === 'terlaris') {
          url += '&sort=rating&order=desc';
        } else {
          url += '&sort=created_at&order=desc';
        }

        const res = await api.get(url);
        const fetchedData = res.data.data || res.data;

        const formatted = fetchedData.map((p, idx) => {
          const regularPrice = parseInt(p.price);
          let originalPrice = null;
          let discountPercentage = null;

          if (type === 'promo') {
            const discounts = [10, 15, 20];
            discountPercentage = discounts[idx % discounts.length];
            originalPrice = Math.round(regularPrice * (1 + discountPercentage / 100));
          }

          return {
            ...p,
            originalPrice,
            discountPercentage,
            is_trending: type === 'terlaris' ? true : p.is_trending
          };
        });

        setProducts(formatted);
      } catch (error) {
        console.error(`Gagal mengambil produk ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [type, initialProducts]);

  // Logika Animasi Scrolling Loop Hybrid (Auto + Manual Scroll)
  useEffect(() => {
    if (loading || products.length === 0 || !scrollRef.current) return;

    const container = scrollRef.current;
    let frameId;

    const step = () => {
      // Hanya geser secara otomatis jika pengguna tidak sedang berinteraksi manual
      if (!isPaused && !isUserInteracting.current) {
        const speedMultiplier = direction === 'left' ? 1 : -1;
        const scrollSpeed = 0.8; // Kecepatan sedang konstan (~0.8px per frame)

        isProgrammaticScroll.current = true;
        container.scrollLeft += scrollSpeed * speedMultiplier;

        // Mendapatkan lebar setengah lintasan karena kita menduplikasi array produk
        const halfWidth = container.scrollWidth / 2;

        // Loop tak terbatas yang mulus
        if (direction === 'left' && container.scrollLeft >= halfWidth) {
          isProgrammaticScroll.current = true;
          container.scrollLeft -= halfWidth;
        } else if (direction === 'right' && container.scrollLeft <= 0) {
          isProgrammaticScroll.current = true;
          container.scrollLeft += halfWidth;
        }
      }
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    };
  }, [isPaused, direction, loading, products]);

  // Fungsi membedakan scroll manual pengguna dengan gerakan program otomatis
  const handleScrollEvent = () => {
    const container = scrollRef.current;
    if (!container) return;

    if (!isProgrammaticScroll.current) {
      // Terdeteksi interaksi manual (Geser manual / Touchpad / Mouse Wheel)
      isUserInteracting.current = true;

      // Reset timer jeda auto-scroll. Lanjut jalan otomatis setelah 2 detik diam.
      if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
      userScrollTimeout.current = setTimeout(() => {
        isUserInteracting.current = false;
      }, 0);
    }
    // Kembalikan flag ke kondisi default
    isProgrammaticScroll.current = false;
  };

  const handleTouchStart = () => {
    isUserInteracting.current = true;
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
  };

  const handleTouchEnd = () => {
    if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
    userScrollTimeout.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 0);
  };

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post('/cart', { product_id: productId, quantity: 1 });
      showToast('Produk berhasil ditambahkan ke keranjang!', 'success');
    } catch (error) {
      if (error.response?.status === 401) {
        showToast('Silakan login terlebih dahulu.', 'error');
      } else {
        showToast('Gagal menambahkan ke keranjang.', 'error');
      }
    }
  };

  if (!loading && products.length === 0) return null;

  return (
    <div className="py-12 border-b border-slate-100 bg-white last:border-0 relative overflow-hidden">
      {/* Modern Toast Notification Portal */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce shadow-2xl flex items-center gap-3 px-5 py-3 rounded-xl border bg-white border-slate-100 text-slate-800">
          <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {type === 'terlaris' ? (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                  <Flame className="w-3.5 h-3.5 fill-current" /> Terlaris Bulan Ini
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                  <Zap className="w-3.5 h-3.5 fill-current" /> Promo Terbatas
                </div>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
          </div>

          {/* Controls Panel (Hanya Tombol Arah Saja) */}
          <div className="flex items-center gap-2.5">
            {/* Tombol Arah Kiri */}
            <button
              onClick={() => setDirection('left')}
              className={`p-2.5 rounded-full border transition-all flex items-center justify-center
                ${direction === 'left'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              title="Geser Kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Tombol Arah Kanan */}
            <button
              onClick={() => setDirection('right')}
              className={`p-2.5 rounded-full border transition-all flex items-center justify-center
                ${direction === 'right'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              title="Geser Kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Marquee & Scrollable Container */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-[280px] shrink-0 rounded-xl overflow-hidden animate-pulse border border-slate-150">
                <div className="h-44 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScrollEvent}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="w-full overflow-x-auto py-2 flex gap-4 scrollbar-none select-none touch-pan-x cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Set Utama */}
            {products.map((product) => (
              <ProductCard
                key={`original-${product.id}`}
                product={product}
                type={type}
                handleAddToCart={handleAddToCart}
              />
            ))}

            {/* Set Duplikasi untuk Efek Loop Seamless */}
            {products.map((product) => (
              <ProductCard
                key={`duplicate-${product.id}`}
                product={product}
                type={type}
                handleAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Sub-komponen Card Produk */
function ProductCard({ product, type, handleAddToCart }) {
  const formattedPrice = parseInt(product.price).toLocaleString('id-ID');
  const formattedOriginalPrice = product.originalPrice ? product.originalPrice.toLocaleString('id-ID') : null;

  return (
    <div className="w-[280px] shrink-0 select-none">
      <div className="group flex flex-col h-full overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative border border-slate-100 bg-white rounded-xl">

        {/* Badge Overlay */}
        {type === 'promo' && product.discountPercentage && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm">
            -{product.discountPercentage}%
          </div>
        )}
        {type === 'terlaris' && (
          <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Best Seller
          </div>
        )}

        {/* Image Container */}
        <div className="relative h-44 bg-slate-50 flex items-center justify-center p-4">
          <img
            src={product.image || `https://placehold.co/300x200/f1f3f5/9ca3af?text=${encodeURIComponent(product.name?.split(' ')[0] || 'Produk')}`}
            alt={product.name}
            className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            loading="lazy"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs px-2.5 py-1 rounded-md font-bold">Habis</span>
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {product.category?.name || 'Komponen'}
            </span>
            <div className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold">
              <Star className="w-3 h-3 fill-current" /> {product.rating || '4.8'}
            </div>
          </div>

          <a
            href={`/products/${product.id}`}
            className="font-bold text-slate-800 text-sm leading-snug mb-1 hover:text-indigo-600 transition-colors line-clamp-2 min-h-[40px] pointer-events-auto"
          >
            {product.name}
          </a>

          <div className="text-xs text-slate-400 mb-4">{product.brand?.name}</div>

          <div className="mt-auto flex items-end justify-between pt-3 border-t border-slate-100">
            <div className="flex flex-col">
              {formattedOriginalPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  Rp {formattedOriginalPrice}
                </span>
              )}
              <span className="font-extrabold text-slate-800 text-base">
                Rp {formattedPrice}
              </span>
            </div>

            <button
              onClick={(e) => handleAddToCart(e, product.id)}
              disabled={product.stock === 0}
              className={`p-2.5 rounded-lg transition-all text-sm pointer-events-auto
                ${product.stock > 0
                  ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              title={product.stock > 0 ? "Tambah ke Keranjang" : "Stok Habis"}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

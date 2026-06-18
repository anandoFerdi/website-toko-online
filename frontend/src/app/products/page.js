"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Cpu, Zap, ShoppingCart, Star, SlidersHorizontal, X, Package, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
export const dynamic = 'force-dynamic';

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryQuery = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: categoryQuery || '',
    brand: '',
    sort: 'created_at',
    order: 'desc'
  });

  useEffect(() => {
    fetchData();
  }, [filters, searchTerm]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
    api.get('/brands').then(res => setBrands(res.data));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = `?sort=${filters.sort}&order=${filters.order}`;
      if (searchTerm) query += `&search=${searchTerm}`;
      if (filters.category) query += `&category=${filters.category}`;
      if (filters.brand) query += `&brand=${filters.brand}`;
      const res = await api.get(`/products${query}`);
      setProducts(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await api.post('/cart', { product_id: productId, quantity: 1 });
      alert('Produk ditambahkan ke keranjang!');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Silakan login terlebih dahulu.');
      } else {
        alert('Gagal menambahkan ke keranjang.');
      }
    }
  };

  const activeFilterCount = [filters.category, filters.brand].filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text-main flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" /> Filter
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ category: '', brand: '', sort: 'created_at', order: 'desc' })}
            className="text-xs text-primary hover:underline font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Kategori</h4>
        <div className="space-y-1">
          <button
            onClick={() => setFilters({ ...filters, category: '' })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center
              ${!filters.category ? 'bg-primary-light text-primary font-semibold' : 'text-text-muted hover:bg-surface-lighter'}`}
          >
            Semua Kategori
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilters({ ...filters, category: cat.slug })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center
                ${filters.category === cat.slug ? 'bg-primary-light text-primary font-semibold' : 'text-text-muted hover:bg-surface-lighter'}`}
            >
              <span>{cat.name}</span>
              <span className="text-xs bg-surface-darker px-1.5 py-0.5 rounded-full text-text-muted">{cat.products_count || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Brand</h4>
        <select
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="input-field text-sm py-2"
        >
          <option value="">Semua Brand</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.slug}>{brand.name}</option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Urutkan</h4>
        <select
          value={`${filters.sort}|${filters.order}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('|');
            setFilters({ ...filters, sort, order });
          }}
          className="input-field text-sm py-2"
        >
          <option value="created_at|desc">Terbaru</option>
          <option value="price|asc">Harga: Murah ke Mahal</option>
          <option value="price|desc">Harga: Mahal ke Murah</option>
          <option value="rating|desc">Rating Tertinggi</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                {filters.category ? categories.find(c => c.slug === filters.category)?.name : 'Semua Produk'}
              </p>
              <h1 className="text-3xl font-extrabold text-text-main">Komponen PC</h1>
              {!loading && (
                <p className="text-text-muted text-sm mt-1">{products.length} produk ditemukan</p>
              )}
            </div>

            {/* Search bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light w-4 h-4" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field !pl-10 pr-10 py-2.5 text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-main">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mt-4 md:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-surface-lighter transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter & Urutkan
            {activeFilterCount > 0 && <span className="badge-primary py-0.5">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar – Desktop */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="card p-5 sticky top-28">
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <div className="relative bg-white w-72 h-full overflow-y-auto p-6 shadow-xl ml-auto">
                <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1 text-text-muted">
                  <X className="w-5 h-5" />
                </button>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card rounded-xl overflow-hidden">
                    <div className="skeleton h-44" />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-3 rounded w-1/3" />
                      <div className="skeleton h-4 rounded w-3/4" />
                      <div className="skeleton h-4 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="card group flex flex-col overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-surface-lighter flex items-center justify-center p-4">
                      <img
                        src={product.image || `https://placehold.co/300x200/f1f3f5/9ca3af?text=${encodeURIComponent(product.name?.split(' ')[0] || 'Produk')}`}
                        alt={product.name}
                        className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.is_trending && (
                        <div className="absolute top-2 left-2 badge bg-red-100 text-red-600 border border-red-200 text-xs">
                          <Zap className="w-3 h-3" /> Trending
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="badge bg-gray-100 text-gray-500 border border-gray-200 text-xs">Habis</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                          {product.category?.name}
                        </span>
                        <div className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold">
                          <Star className="w-3 h-3 fill-current" /> {product.rating || '4.8'}
                        </div>
                      </div>

                      <Link href={`/products/${product.id}`} className="font-semibold text-text-main text-sm leading-snug mb-1 hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </Link>
                      <div className="text-xs text-text-muted mb-3">{product.brand?.name}</div>

                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                        <div className="font-extrabold text-text-main text-base">
                          Rp {parseInt(product.price).toLocaleString('id-ID')}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0}
                          className={`p-2.5 rounded-lg transition-all text-sm
                            ${product.stock > 0
                              ? 'bg-primary-light text-primary hover:bg-primary hover:text-white shadow-btn'
                              : 'bg-surface-lighter text-text-light cursor-not-allowed'
                            }`}
                          title={product.stock > 0 ? "Tambah ke Keranjang" : "Stok Habis"}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card p-16 flex flex-col items-center justify-center text-center">
                <Package className="w-16 h-16 text-text-light mb-4" />
                <h3 className="text-lg font-bold text-text-main mb-2">Tidak ada produk ditemukan</h3>
                <p className="text-text-muted text-sm mb-6">Coba ubah filter atau kata kunci pencarian Anda.</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilters({ category: '', brand: '', sort: 'created_at', order: 'desc' }); }}
                  className="btn-secondary text-sm"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-8"><div className="skeleton h-32 w-full max-w-4xl rounded-xl"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

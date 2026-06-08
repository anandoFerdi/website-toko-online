"use client";

import { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, X, Search, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageMode, setImageMode] = useState('link'); // 'link' or 'upload'
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    price: '',
    stock: '',
    description: '',
    image: '',
    specs: '',
    compatibility: '',
    is_trending: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands')
      ]);
      // Assuming paginated response for products
      setProducts(prodRes.data.data || prodRes.data);
      setCategories(catRes.data);
      setBrands(brandRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      brand_id: brands[0]?.id || '',
      price: '',
      stock: '',
      description: '',
      image: '',
      specs: '',
      compatibility: '',
      is_trending: false
    });
    setEditingId(null);
    setImageMode('link');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      category_id: product.category_id,
      brand_id: product.brand_id,
      price: parseInt(product.price).toString(),
      stock: product.stock.toString(),
      description: product.description || '',
      image: product.image || '',
      specs: typeof product.specs === 'object' ? JSON.stringify(product.specs, null, 2) : product.specs,
      compatibility: typeof product.compatibility === 'object' ? JSON.stringify(product.compatibility, null, 2) : product.compatibility,
      is_trending: Boolean(product.is_trending),
      is_active: product.is_active !== undefined ? Boolean(product.is_active) : true
    });
    setEditingId(product.id);
    setImageMode('link');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let parsedSpecs = null;
      let parsedCompatibility = null;

      if (formData.specs && formData.specs.trim() != '') {
        try {
          parsedSpecs = JSON.parse(formData.specs);
        } catch (e) {
          alert("Format JSON pada kolom Spesifikasi tidak valid! Periksa kembali tanda petik atau kurung kurawal.");
          setIsSubmitting(false);
          return;
        }
      }

      if (formData.compatibility && formData.compatibility.trim() != '') {
        try {
          parsedCompatibility = JSON.parse(formData.compatibility);
        } catch {
          alert("Format JSON pada kolom Kompatibilitas tidak valid! Periksa kembali tanda petik atau kurung kurawal.");
          setIsSubmitting(false);
          return;
        }
      }

      let formPayload;
      let isMultipart = false;

      if (imageMode === 'upload' && imageFile) {
        isMultipart = true;
        formPayload = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'specs' || key === 'compatibility' || key === 'image') return;
          formPayload.append(key, formData[key]);
        });
        
        formPayload.append('price', parseInt(formData.price));
        formPayload.append('stock', parseInt(formData.stock));
        formPayload.append('is_trending', formData.is_trending ? 1 : 0);
        formPayload.append('is_active', formData.is_active !== undefined ? (formData.is_active ? 1 : 0) : 1);
        
        // Laravel's ProductController expects array for specs and compatibility, but we are sending FormData (which only accepts string)
        // Wait, the API validates them as `nullable|array`. If we send JSON string via FormData, it might fail validation unless we handle it.
        // Actually, if we send JSON string, Laravel validate array will fail. We should append them as array fields.
        if (parsedSpecs) {
          Object.keys(parsedSpecs).forEach(k => {
            formPayload.append(`specs[${k}]`, parsedSpecs[k]);
          });
        }
        if (parsedCompatibility) {
          Object.keys(parsedCompatibility).forEach(k => {
            formPayload.append(`compatibility[${k}]`, parsedCompatibility[k]);
          });
        }
        
        formPayload.append('image', imageFile);
        
        if (editingId) {
          formPayload.append('_method', 'PUT');
        }
      } else {
        formPayload = {
          ...formData,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock),
          specs: parsedSpecs,
          compatibility: parsedCompatibility,
          is_active: formData.is_active !== undefined ? formData.is_active : true
        };
        if (imageMode === 'upload') {
           formPayload.image = formData.image; // keep existing if edit
        }
      }

      if (editingId) {
        if (isMultipart) {
          await api.post(`/admin/products/${editingId}`, formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.put(`/admin/products/${editingId}`, formPayload);
        }
      } else {
        if (isMultipart) {
          await api.post('/admin/products', formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.post('/admin/products', formPayload);
        }
      }
      closeModal();
      fetchData(); // re-fetch
    } catch (error) {
      alert("Gagal menyimpan produk. Periksa kembali input Anda.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchData();
    } catch (error) {
      alert("Gagal menghapus produk.");
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Manajemen Produk
          </h1>
          <p className="text-text-muted mt-1">Kelola daftar komponen komputer yang dijual.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-text-muted font-medium">
            Total: {filteredProducts.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Kategori & Brand</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-center">Stok</th>
                <th className="px-6 py-4 text-center">Trending</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-surface-darker border-t-primary"></div></div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-surface-lighter flex items-center justify-center p-1 border border-border shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                      <div className="font-bold text-text-main truncate max-w-xs" title={product.name}>
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs bg-surface-lighter px-2 py-0.5 rounded border border-border w-fit">{product.category?.name}</span>
                        <span className="text-xs text-text-muted font-medium">{product.brand?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary">
                      Rp {parseInt(product.price).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.is_trending ? (
                        <span className="text-orange-500 font-bold">Ya</span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-muted">
                    Produk tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
              <h2 className="font-bold text-lg text-text-main">
                {editingId ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={closeModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block">Nama Produk *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">Kategori *</label>
                  <select
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">Brand *</label>
                  <select
                    name="brand_id"
                    required
                    value={formData.brand_id}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>Pilih Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">Harga (Rp) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">Stok *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block mb-1">Gambar Produk</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={imageMode === 'link'} 
                        onChange={() => setImageMode('link')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Link URL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={imageMode === 'upload'} 
                        onChange={() => setImageMode('upload')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Upload File</span>
                    </label>
                  </div>

                  {imageMode === 'link' ? (
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="https://..."
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="block w-full text-sm text-text-muted
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary/10 file:text-primary
                          hover:file:bg-primary/20
                          cursor-pointer"
                      />
                      {editingId && formData.image && !imageFile && (
                        <span className="text-xs text-orange-600 shrink-0">
                          (Kosongkan jika tidak ingin mengubah gambar)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block">Deskripsi (Opsional)</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                  ></textarea>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block">Spesifikasi (Format JSON / Opsional)</label>
                  <textarea
                    name="specs"
                    rows={3}
                    value={formData.specs}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    placeholder='Contoh: {"vram": "8GB", "processor": "Intel i7"}'
                  ></textarea>
                  <p className="text-[11px] text-text-muted mt-0.5">Gunakan format JSON objek standar agar dapat terbaca sistem tabel spesifikasi.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block">Kompatibilitas (Format JSON / Opsional)</label>
                  <textarea
                    name="compatibility"
                    rows={3}
                    value={formData.compatibility}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    placeholder='Contoh: {"socket": "AM4", "chipset": "B550"}'
                  ></textarea>
                </div>

                <div className="space-y-2 md:col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="is_trending"
                    name="is_trending"
                    checked={formData.is_trending}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label htmlFor="is_trending" className="text-sm font-medium text-text-main cursor-pointer">
                    Tandai sebagai Produk Terlaris (Trending)
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg font-medium text-text-muted hover:bg-surface-lighter transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

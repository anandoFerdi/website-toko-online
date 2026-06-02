"use client";

import { useState, useEffect } from 'react';
import { Hash, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import api from '@/lib/api';

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands');
      setBrands(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setFormData({ name: '', logo: '', description: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (brand) => {
    setFormData({ 
      name: brand.name, 
      logo: brand.logo || '', 
      description: brand.description || '' 
    });
    setEditingId(brand.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/brands/${editingId}`, formData);
      } else {
        await api.post('/admin/brands', formData);
      }
      closeModal();
      fetchBrands();
    } catch (error) {
      alert("Gagal menyimpan brand. Pastikan nama tidak duplikat.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus brand ini?")) return;
    try {
      await api.delete(`/admin/brands/${id}`);
      fetchBrands();
    } catch (error) {
      alert("Gagal menghapus. Pastikan brand ini tidak memiliki produk.");
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Hash className="w-6 h-6 text-primary" /> Manajemen Brand
          </h1>
          <p className="text-text-muted mt-1">Kelola daftar merek produk.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Brand
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari brand..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-text-muted font-medium">
            Total: {filteredBrands.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Nama Brand</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Logo URL</th>
                <th className="px-6 py-4 text-center">Jml Produk</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-surface-darker border-t-primary"></div></div>
                  </td>
                </tr>
              ) : filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main flex items-center gap-3">
                      {brand.logo ? (
                        <div className="w-8 h-8 rounded bg-surface-lighter flex items-center justify-center p-1 border border-border">
                          <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-surface-lighter flex items-center justify-center text-text-muted font-bold border border-border">
                          {brand.name.charAt(0)}
                        </div>
                      )}
                      {brand.name}
                    </td>
                    <td className="px-6 py-4 text-text-muted">{brand.slug}</td>
                    <td className="px-6 py-4 text-text-muted truncate max-w-xs">{brand.logo || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
                        {brand.products_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(brand)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                    Brand tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
              <h2 className="font-bold text-lg text-text-main">
                {editingId ? 'Edit Brand' : 'Tambah Brand'}
              </h2>
              <button onClick={closeModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Nama Brand *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Misal: ASUS"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Logo URL (Opsional)</label>
                <input 
                  type="url" 
                  value={formData.logo}
                  onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Deskripsi (Opsional)</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Deskripsi singkat brand..."
                ></textarea>
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

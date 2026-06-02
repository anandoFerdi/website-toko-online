"use client";

import { useState, useEffect } from 'react';
import { Tags, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import api from '@/lib/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setFormData({ name: '', icon: '', description: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setFormData({ 
      name: category.name, 
      icon: category.icon || '', 
      description: category.description || '' 
    });
    setEditingId(category.id);
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
        await api.put(`/admin/categories/${editingId}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      alert("Gagal menyimpan kategori. Pastikan nama tidak duplikat.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert("Gagal menghapus. Pastikan kategori ini tidak memiliki produk.");
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Tags className="w-6 h-6 text-primary" /> Manajemen Kategori
          </h1>
          <p className="text-text-muted mt-1">Kelola daftar kategori komponen PC.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari kategori..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-text-muted font-medium">
            Total: {filteredCategories.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Nama Kategori</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Icon</th>
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
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main">{category.name}</td>
                    <td className="px-6 py-4 text-text-muted">{category.slug}</td>
                    <td className="px-6 py-4 text-text-muted">{category.icon || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
                        {category.products_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(category)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
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
                    Kategori tidak ditemukan.
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
                {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button onClick={closeModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Nama Kategori *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Misal: Processor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Icon (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nama icon Lucide, misal: Cpu"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-main block">Deskripsi (Opsional)</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Deskripsi singkat kategori..."
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

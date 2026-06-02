"use client";

import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, X, Search, Shield, User } from 'lucide-react';
import api from '@/lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, meRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/me')
      ]);
      setUsers(usersRes.data);
      setCurrentUser(meRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      phone: '',
      address: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setFormData({ 
      name: user.name,
      email: user.email,
      password: '', // Kosongkan password saat edit
      role: user.role,
      phone: user.phone || '',
      address: user.address || ''
    });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      
      // Hapus password dari payload jika kosong (saat edit)
      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await api.put(`/admin/users/${editingId}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert("Gagal menyimpan pengguna. Pastikan email unik dan form diisi dengan benar.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      alert("Anda tidak bisa menghapus akun Anda sendiri.");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData();
    } catch (error) {
      alert("Gagal menghapus pengguna.");
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Manajemen Pengguna
          </h1>
          <p className="text-text-muted mt-1">Kelola daftar pengguna dan hak akses admin.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="text-sm text-text-muted font-medium">
            Total: {filteredUsers.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-lighter text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email & No HP</th>
                <th className="px-6 py-4 text-center">Role</th>
                <th className="px-6 py-4">Bergabung</th>
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
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main">
                      {user.name}
                      {user.id === currentUser?.id && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Anda</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span>{user.email}</span>
                        <span className="text-xs text-text-muted">{user.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          <Shield className="w-3.5 h-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          <User className="w-3.5 h-3.5" /> User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUser?.id}
                          className={`p-1.5 rounded transition-colors ${user.id === currentUser?.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`} 
                          title={user.id === currentUser?.id ? "Tidak bisa hapus diri sendiri" : "Hapus"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                    Pengguna tidak ditemukan.
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
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button onClick={closeModal} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block">Nama Lengkap *</label>
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
                  <label className="text-sm font-medium text-text-main block">Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">Role *</label>
                  <select 
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="user">User Biasa</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">No Telepon</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-main block">
                    Password {editingId && <span className="text-text-muted font-normal">(Kosongkan jika tidak ingin diubah)</span>} {!editingId && '*'}
                  </label>
                  <input 
                    type="password" 
                    name="password"
                    required={!editingId}
                    minLength="8"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingId ? "Biarkan kosong..." : "Minimal 8 karakter"}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-text-main block">Alamat</label>
                  <textarea 
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                  ></textarea>
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

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    api.get('/me')
      .then(res => {
        if (res.data.role !== 'admin') {
          router.push('/');
        } else {
          setUser(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        Cookies.remove('auth_token');
        router.push('/login');
      });
  }, [mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-darker border-t-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

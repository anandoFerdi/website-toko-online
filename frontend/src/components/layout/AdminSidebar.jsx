"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Hash, 
  ShoppingCart, 
  Users, 
  MessageSquare,
  LogOut,
  Store
} from 'lucide-react';
import Cookies from 'js-cookie';

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    Cookies.remove('auth_token');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pesanan', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Produk', href: '/admin/products', icon: Package },
    { name: 'Kategori', href: '/admin/categories', icon: Tags },
    { name: 'Brand', href: '/admin/brands', icon: Hash },
    { name: 'Pelanggan', href: '/admin/users', icon: Users },
    { name: 'AI Chat', href: '/admin/ai-chats', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/admin" className="text-xl font-extrabold text-primary flex items-center gap-2">
          Admin Panel
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-2">Menu Utama</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-muted hover:bg-surface-lighter hover:text-text-main'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border flex flex-col gap-2">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-text-muted hover:bg-surface-lighter hover:text-text-main transition-all"
        >
          <Store className="w-5 h-5" />
          Lihat Toko
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-all w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}

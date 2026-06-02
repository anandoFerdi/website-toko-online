"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, User, Cpu, Search, ChevronDown, Bot } from 'lucide-react';
import Cookies from 'js-cookie';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [token, setToken] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const currentToken = Cookies.get('auth_token');
    setToken(currentToken);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    const fetchCartCount = async () => {
      if (!currentToken) return;
      try {
        const { default: api } = await import('@/lib/api');
        const res = await api.get('/cart');
        setCartCount(res.data.count || 0);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCartCount();

    // Listen to custom event to update cart
    window.addEventListener('cart_updated', fetchCartCount);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cart_updated', fetchCartCount);
    };
  }, []);

  const navLinks = [
    { name: 'Produk', path: '/products' },
    { name: 'PC Builder', path: '/ai-builder', isAI: true },
    { name: 'Cek Kompatibilitas', path: '/compatibility' },
  ];

  const handleLogout = () => {
    Cookies.remove('auth_token');
    window.location.href = '/';
  };

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-primary text-white text-center py-2 text-xs font-medium tracking-wide">
        🚚 Gratis Ongkir untuk pembelian di atas Rp 500.000 &nbsp;·&nbsp; 🤖 Fitur AI Builder tersedia — <Link href="/ai-builder" className="underline underline-offset-2 hover:text-blue-100">Coba Sekarang</Link>
      </div>

      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-nav top-0' : 'bg-white/95 backdrop-blur-sm top-7'} border-b border-border`}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-btn-primary">
                <Cpu className="text-white w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-lg font-extrabold text-text-main tracking-tight">
                  Gudang<span className="text-primary">Komputer</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center px-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                    ${pathname === link.path
                      ? 'bg-primary-light text-primary'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-lighter'
                    }
                    ${link.isAI ? 'border border-secondary/30 text-secondary hover:bg-secondary-light' : ''}
                  `}
                >
                  {link.isAI && <Bot className="w-3.5 h-3.5" />}
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <Link href="/cart" className="relative p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-primary-light">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-primary text-[10px] flex items-center justify-center rounded-full text-white font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {token ? (
                <div className="flex items-center gap-2">
                  <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-lighter transition-colors">
                    <User className="w-4 h-4" /> Profil
                  </Link>
                  <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">Keluar</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-text-main hover:text-primary transition-colors">Masuk</Link>
                  <Link href="/register" className="btn-primary py-2 text-sm">Daftar</Link>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 text-text-muted rounded-lg hover:bg-surface-lighter transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-border shadow-lg">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                    ${pathname === link.path ? 'bg-primary-light text-primary' : 'text-text-muted hover:bg-surface-lighter'}
                    ${link.isAI ? 'border border-secondary/30 text-secondary' : ''}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {link.isAI && <Bot className="w-4 h-4" />}
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <Link href="/cart" className="px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-lighter flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <ShoppingCart className="w-4 h-4" /> Keranjang
              </Link>
              {token ? (
                <>
                  <Link href="/profile" className="px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-lighter" onClick={() => setIsOpen(false)}>Profil Saya</Link>
                  <button onClick={handleLogout} className="px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 text-left">Keluar</button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="flex-1 text-center py-2.5 border border-border rounded-lg text-sm font-medium" onClick={() => setIsOpen(false)}>Masuk</Link>
                  <Link href="/register" className="flex-1 text-center py-2.5 bg-primary text-white rounded-lg text-sm font-medium" onClick={() => setIsOpen(false)}>Daftar</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Offset for announcement bar */}
      <div className="h-7" />
    </>
  );
}

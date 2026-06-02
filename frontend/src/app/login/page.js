"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Cpu, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '@/lib/api';

// Google reCAPTCHA v2 test site key (always passes - replace with real key in production)
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Harap selesaikan verifikasi CAPTCHA terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/login', { email, password, captcha_token: captchaToken });

      // Store token in cookies
      Cookies.set('auth_token', res.data.token, { expires: 7 });

      // Redirect to home page with a full reload to refresh Navbar state
      window.location.href = '/';
    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Email atau password salah.';
      setError(msg);
      // Reset captcha on failure
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8 card p-8 md:p-10 bg-white border border-border shadow-card relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-blue-400" />

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-btn-primary">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold text-text-main tracking-tight">
              Gudang<span className="text-primary">Komputer</span>
            </span>
          </Link>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-main">
            Selamat Datang Kembali!
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Masuk untuk melanjutkan belanja &amp; rakit PC impian Anda
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3.5 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5" htmlFor="email">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field !pl-11 py-3 text-sm w-full"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5" htmlFor="password">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field !pl-11 pr-11 py-3 text-sm w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-light hover:text-text-main transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20"
              />
              <label htmlFor="remember-me" className="ml-2 block text-text-muted font-medium">
                Ingat saya
              </label>
            </div>
            <Link href="#" className="font-semibold text-primary hover:underline">
              Lupa kata sandi?
            </Link>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full btn-primary py-3 text-sm mt-4 relative flex justify-center items-center font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Masuk Sekarang"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-text-muted pt-2">
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

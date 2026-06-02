"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Cpu, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '@/lib/api';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (formData.password !== formData.password_confirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!captchaToken) {
      setError('Harap selesaikan verifikasi CAPTCHA terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/register', { ...formData, captcha_token: captchaToken });
      Cookies.set('auth_token', res.data.token, { expires: 7 });
      window.location.href = '/';
    } catch (err) {
      console.error("Registration failed:", err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors) {
          setFieldErrors(errors);
        } else {
          setError(err.response.data.message || 'Registrasi gagal. Coba lagi.');
        }
      } else {
        setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
      }
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `input-field pl-11 py-2.5 text-sm ${fieldErrors[field] ? 'border-red-500 focus:ring-red-200' : ''}`;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-7 card p-8 md:p-10 bg-white border border-border shadow-card relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-blue-400" />

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-btn-primary">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold text-text-main tracking-tight">
              Gudang<span className="text-primary">Komputer</span>
            </span>
          </Link>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-main">
            Daftar Akun Baru
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Buat akun untuk memulai rakitan PC Anda sendiri!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3.5 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1" htmlFor="name">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <User className="h-5 w-5" />
              </div>
              <input
                id="name" name="name" type="text" required
                value={formData.name} onChange={handleChange}
                className={`${inputClass('name')} !pl-11 py-3 text-sm`} placeholder="Nama Lengkap Anda"
              />
            </div>
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.name[0]}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1" htmlFor="email">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email" name="email" type="email" required
                value={formData.email} onChange={handleChange}
                className={`${inputClass('email')} !pl-11 py-3 text-sm`} placeholder="nama@email.com"
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email[0]}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1" htmlFor="phone">
              Nomor Telepon <span className="text-text-muted font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Phone className="h-5 w-5" />
              </div>
              <input
                id="phone" name="phone" type="tel"
                value={formData.phone} onChange={handleChange}
                className={`${inputClass('phone')} !pl-11 py-3 text-sm`} placeholder="0812xxxxxxxx"
              />
            </div>
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.phone[0]}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1" htmlFor="password">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password" name="password"
                type={showPassword ? "text" : "password"} required
                value={formData.password} onChange={handleChange}
                className={`${inputClass('password')} !pl-11 py-3 text-sm`} placeholder="Minimal 8 karakter"
              />
              <button type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-light hover:text-text-main transition-colors"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password[0]}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1" htmlFor="password_confirmation">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-light">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password_confirmation" name="password_confirmation"
                type={showConfirmPassword ? "text" : "password"} required
                value={formData.password_confirmation} onChange={handleChange}
                className="input-field !pl-11 pr-11 py-2.5 text-sm" placeholder="Ulangi kata sandi"
              />
              <button type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-light hover:text-text-main transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center pt-1">
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
            className="w-full btn-primary py-3 text-sm mt-2 relative flex justify-center items-center font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Daftar Sekarang"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-text-muted pt-1">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Masuk Di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}

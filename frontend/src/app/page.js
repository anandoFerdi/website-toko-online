"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bot, Cpu, Zap, ArrowRight, ShieldCheck, Wrench, Star, Truck, CreditCard, HeadphonesIcon, Package, ChevronRight } from "lucide-react";
import ProductSlider from "@/components/home/ProductSlider";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function Home() {
  const categories = [
    { name: 'Prosesor', icon: <Cpu className="w-6 h-6" />, slug: 'cpu', color: 'bg-blue-50 text-blue-600', count: '120+ Produk' },
    { name: 'Kartu Grafis', icon: <Zap className="w-6 h-6" />, slug: 'gpu', color: 'bg-purple-50 text-purple-600', count: '85+ Produk' },
    { name: 'Motherboard', icon: <Package className="w-6 h-6" />, slug: 'motherboard', color: 'bg-orange-50 text-orange-600', count: '60+ Produk' },
    { name: 'RAM & Storage', icon: <Package className="w-6 h-6" />, slug: 'ram', color: 'bg-green-50 text-green-600', count: '200+ Produk' },
  ];

  const aiFeatures = [
    {
      icon: <Bot className="w-6 h-6 text-secondary" />,
      title: "AI PC Builder",
      description: "Beritahu budget & kebutuhanmu — AI kami merakit konfigurasi PC terbaik secara instan.",
      path: "/ai-builder",
      badge: "Paling Populer",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-secondary" />,
      title: "Cek Kompatibilitas",
      description: "Pastikan komponen yang kamu pilih cocok satu sama lain sebelum membeli.",
      path: "/compatibility",
      badge: "Gratis",
    },
    {
      icon: <Wrench className="w-6 h-6 text-secondary" />,
      title: "Asisten AI",
      description: "Tanya apapun seputar spesifikasi, perbandingan produk, atau saran upgrade.",
      path: "#",
      badge: "24/7",
    },
  ];

  const trust = [
    { icon: <Truck className="w-5 h-5 text-primary" />, title: "Gratis Ongkir", desc: "Pembelian > Rp 500rb" },
    { icon: <ShieldCheck className="w-5 h-5 text-primary" />, title: "Garansi Resmi", desc: "Semua produk bergaransi" },
    { icon: <CreditCard className="w-5 h-5 text-primary" />, title: "Bayar Aman", desc: "Berbagai metode pembayaran" },
    { icon: <HeadphonesIcon className="w-5 h-5 text-primary" />, title: "Dukungan 24/7", desc: "Siap membantu kapanpun" },
  ];

  const testimonials = [
    { name: "Andi Pratama", role: "Content Creator", rating: 5, comment: "AI Builder-nya luar biasa! Langsung dapat rekomendasi GPU yang cocok dengan budget saya. Pengirimannya juga cepat banget." },
    { name: "Rina Susanti", role: "Software Developer", rating: 5, comment: "Fitur cek kompatibilitas sangat membantu. Saya jadi yakin sebelum beli motherboard dan RAM. Harga juga bersaing!" },
    { name: "Budi Santoso", role: "Gamer", rating: 5, comment: "Udah 3 kali order di sini dan selalu puas. Produknya original semua, packaging aman, dan CS responsif." },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO SECTION ── */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp()}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-light text-primary rounded-full text-xs font-semibold mb-5 border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Toko Komponen PC #1 Indonesia
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-main leading-tight mb-5">
                Rakit PC Impianmu <br />
                <span className="text-primary">Harga Terbaik</span>,<br />
                <span className="text-secondary text-3xl md:text-4xl font-bold">Dibantu AI ✨</span>
              </h1>

              <p className="text-text-muted text-lg leading-relaxed mb-8 max-w-xl">
                Temukan ribuan komponen PC original bergaransi dari brand terkemuka. Bingung merakit? Biarkan asisten AI kami yang membimbing.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary flex items-center gap-2 text-base">
                  Belanja Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/ai-builder" className="btn-secondary flex items-center gap-2 text-base border-secondary/40 text-secondary hover:bg-secondary-light">
                  <Bot className="w-4 h-4" /> Coba AI Builder
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-text-main">10K+</div>
                  <div className="text-xs text-text-muted">Produk Tersedia</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-text-main">50K+</div>
                  <div className="text-xs text-text-muted">Pelanggan Puas</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-text-main">4.9★</div>
                  <div className="text-xs text-text-muted">Rating Toko</div>
                </div>
              </div>
            </motion.div>

            {/* Hero visual */}
            <motion.div {...fadeUp(0.2)} className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-primary-light to-secondary-light rounded-3xl flex items-center justify-center shadow-card-hover">
                  <div className="grid grid-cols-2 gap-4 p-6">
                    {[
                      { icon: <Cpu className="w-8 h-8 text-primary" />, label: "CPU", price: "Rp 2.5jt" },
                      { icon: <Zap className="w-8 h-8 text-purple-500" />, label: "GPU", price: "Rp 5.8jt" },
                      { icon: <Package className="w-8 h-8 text-orange-500" />, label: "RAM", price: "Rp 980rb" },
                      { icon: <Package className="w-8 h-8 text-green-500" />, label: "SSD", price: "Rp 750rb" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-card text-center">
                        <div className="flex justify-center mb-2">{item.icon}</div>
                        <div className="text-xs font-bold text-text-main">{item.label}</div>
                        <div className="text-xs text-primary font-semibold">{item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* AI badge floating */}
                <div className="absolute -bottom-4 -right-4 bg-secondary text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2">
                  <Bot className="w-4 h-4" /> AI Powered
                </div>
                <div className="absolute -top-4 -left-4 bg-white border border-border rounded-xl px-3 py-2 shadow-card text-xs font-bold text-text-main flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Garansi Resmi
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 md:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-border">
            {trust.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <div className="p-2 bg-primary-light rounded-lg shrink-0">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-text-main">{item.title}</div>
                  <div className="text-xs text-text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeUp()} className="flex justify-between items-end mb-8">
            <div>
              <p className="section-label">Kategori</p>
              <h2 className="section-title">Belanja Berdasarkan Kategori</h2>
            </div>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)}>
                <Link href={`/products?category=${cat.slug}`} className="card-hover p-6 flex flex-col items-center text-center gap-3 cursor-pointer group block">
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {cat.icon}
                  </div>
                  <div>
                    <div className="font-bold text-text-main text-sm">{cat.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">{cat.count}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT CAROUSELS ── */}
      <ProductSlider title="Produk Terlaris 🔥" type="terlaris" />
      {/* <ProductSlider title="Promo Spesial Hari Ini ⚡" type="promo" /> */}

      {/* ── AI FEATURES ── */}
      <section className="py-16 bg-gradient-to-br from-secondary-light/40 via-white to-primary-light/40 border-y border-border">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <div className="ai-tag mx-auto mb-4">
              <Bot className="w-3.5 h-3.5" /> Fitur AI Eksklusif
            </div>
            <h2 className="section-title mb-3">Belanja Lebih Cerdas dengan AI</h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Kami mengintegrasikan kecerdasan buatan agar Anda mendapat komponen yang tepat, tanpa kerumitan.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiFeatures.map((feat, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)}>
                <Link href={feat.path} className="card-hover p-7 flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 bg-secondary-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {feat.icon}
                    </div>
                    <span className="badge bg-accent-light text-accent-dark text-xs">{feat.badge}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-main mb-2">{feat.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed flex-1">{feat.description}</p>
                  <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-secondary group-hover:gap-2 transition-all">
                    Coba Sekarang <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <p className="section-label">Ulasan Pelanggan</p>
            <h2 className="section-title">Apa Kata Mereka?</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-text-muted text-sm leading-relaxed mb-5">"{t.comment}"</p>
                <div>
                  <div className="font-bold text-text-main text-sm">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Siap Merakit PC Impianmu?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Gunakan AI Builder kami untuk mendapat rekomendasi rakitan terbaik sesuai budget, atau langsung telusuri ribuan produk kami.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="px-8 py-3.5 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2">
                Belanja Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/ai-builder" className="px-8 py-3.5 border-2 border-white/40 text-white font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-2">
                <Bot className="w-4 h-4" /> Coba AI Builder
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Cpu, Mail, Phone, MapPin, Bot } from 'lucide-react';

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20.06 12 20.06 12 20.06s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

export default function Footer() {
  const shopLinks = [
    { name: 'Semua Produk', path: '/products' },
    { name: 'Prosesor (CPU)', path: '/products?category=cpu' },
    { name: 'Kartu Grafis (GPU)', path: '/products?category=gpu' },
    { name: 'Motherboard', path: '/products?category=motherboard' },
    { name: 'RAM & Storage', path: '/products?category=ram' },
  ];

  const aiLinks = [
    { name: 'AI PC Builder', path: '/ai-builder' },
    { name: 'Cek Kompatibilitas', path: '/compatibility' },
    { name: 'Rekomendasi Cerdas', path: '/products' },
  ];

  const supportLinks = [
    { name: 'Hubungi Kami', path: '#' },
    { name: 'FAQ', path: '#' },
    { name: 'Info Pengiriman', path: '#' },
    { name: 'Kebijakan Retur', path: '#' },
    { name: 'Garansi Produk', path: '#' },
  ];

  return (
    <footer className="bg-text-main text-white mt-16">
      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Cpu className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Gudang<span className="text-primary">Komputer</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              Toko komponen PC terlengkap dan terpercaya. Kami menyediakan ribuan produk dari brand terkemuka dengan harga kompetitif dan garansi resmi.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 text-sm text-white/60 mb-6">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>(021) 1234-5678</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>support@gudangkomputer.id</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              {[FacebookIcon, InstagramIcon, YoutubeIcon].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Belanja</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.path} className="text-white/55 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Features */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-secondary" /> Fitur AI
            </h4>
            <ul className="space-y-3">
              {aiLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.path} className="text-white/55 hover:text-secondary text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Bantuan</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.path} className="text-white/55 hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} Gudang Komputer. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex gap-5">
            <Link href="#" className="text-white/40 hover:text-white/70 text-xs transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="text-white/40 hover:text-white/70 text-xs transition-colors">Syarat & Ketentuan</Link>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span>Powered by</span>
            <span className="text-secondary font-semibold flex items-center gap-1"><Bot className="w-3 h-3" /> Gemini AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

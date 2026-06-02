import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChatbot from "@/components/ai/AIChatbot";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Gudang Komputer - Toko Komponen PC Terlengkap",
  description: "Toko komponen PC terlengkap dengan harga terbaik. Temukan prosesor, GPU, motherboard, RAM, dan lainnya. Dilengkapi fitur AI Builder untuk merakit PC sesuai kebutuhan Anda.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased bg-background text-text-main min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-grow flex-1 w-full pt-16">
          {children}
        </main>
        <Footer />
        <AIChatbot />
      </body>
    </html>
  );
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        surface: '#ffffff',
        'surface-lighter': '#f1f3f5',
        'surface-darker': '#e9ecef',
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#dbeafe',
          glow: 'rgba(37, 99, 235, 0.2)',
        },
        secondary: {
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
          light: '#ede9fe',
          glow: 'rgba(124, 58, 237, 0.2)',
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fef3c7',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        text: {
          main: '#111827',
          muted: '#6b7280',
          light: '#9ca3af',
        },
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#d1d5db',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        'nav': '0 1px 3px rgba(0,0,0,0.08)',
        'btn': '0 1px 2px rgba(0,0,0,0.1)',
        'btn-primary': '0 4px 14px rgba(37,99,235,0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }, // Bergeser tepat setengah total lebar container hasil kloning
        }
      }
    },
  },
  plugins: [],
};

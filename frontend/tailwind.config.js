import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: {
          DEFAULT: 'var(--bg-card)',
          muted: 'var(--bg-card-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
          focus: 'var(--border-focus)',
        },
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        accent: {
          black: 'var(--accent-black)',
          'black-hover': 'var(--accent-black-hover)',
        },
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'subtle-modal': '0 4px 16px rgba(17, 17, 20, 0.06)',
        'subtle-dropdown': '0 2px 8px rgba(17, 17, 20, 0.08)',
        // Menu aksi titik tiga: melayang di atas tabel, jadi shadow-nya lebih terlihat.
        'menu': '0 14px 32px -8px rgba(17, 17, 20, 0.22), 0 4px 10px -4px rgba(17, 17, 20, 0.12)',
        'menu-dark': '0 16px 40px -8px rgba(0, 0, 0, 0.75), 0 4px 12px -4px rgba(0, 0, 0, 0.55)',
        // Tab aktif pada tab-bar model pil.
        'tab': '0 1px 2px rgba(17, 17, 20, 0.10), 0 0 0 1px rgba(17, 17, 20, 0.05)',
        'none': 'none',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [
    tailwindcssAnimate
  ],
}

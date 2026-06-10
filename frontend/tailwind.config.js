/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d8ff',
          400: '#7c9ef8',
          500: '#5b7ef5',
          600: '#3d5fe0',
          700: '#2d4bc8',
          800: '#1e35a8',
          900: '#0f1f6b',
        },
        surface: {
          0: '#ffffff',
          1: '#f8f9fc',
          2: '#f1f3f9',
          3: '#e8ecf4',
        },
        ink: {
          1: '#0d1117',
          2: '#2d3340',
          3: '#5a6478',
          4: '#8b95a8',
          5: '#b8c0cc',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'panel': '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}

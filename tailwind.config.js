/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      /* ─── Netflix Design Palette ─── */
      colors: {
        brand: {
          red:      '#E50914',
          redHover: '#F40612',
          /* Background layers */
          black:    '#000000',
          surface:  '#0A0A0A',
          card:     '#161616',
          /* Text scale */
          white:    '#FFFFFF',
          light:    '#E5E5E5',
          muted:    '#B3B3B3',
          subtle:   '#737373',
          /* UI elements */
          gray:     '#2B2B2B',
          border:   'rgba(255,255,255,0.10)',
        },
      },

      /* ─── Inter font ─── */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },

      /* ─── Fluid type scale ─── */
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      /* ─── Spacing additions ─── */
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },

      /* ─── Animation ─── */
      transitionDuration: {
        250: '250ms',
      },

      /* ─── Border radius ─── */
      borderRadius: {
        xl2: '0.925rem',
      },
    },
  },
  plugins: [],
};
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
        // ── Existing tokens (unchanged) ──────────────────────────────
        primary: {
          gray: '#F5F7FA',
          navy: '#2D3250',
          'navy-dark': '#1F2937',
          cyan: '#00D9D9',
          'cyan-dark': '#00B8B8',
          orange: '#FF9F43',
          'orange-light': '#FFB976',
        },
        dark: {
          bg: '#1A1D2E',
          card: '#2D3250',
          'card-light': '#3A3F5C',
          cyan: '#00D9D9',
          'cyan-glow': '#00FFFF',
          orange: '#FF9F43',
        },

        // ── $READS brand tokens (new) ────────────────────────────────
        reads: {
          // Backgrounds
          cream:       '#F5F0E8',   // Login page background
          'cream-mid': '#EDE7D9',   // Subtle card bg tint

          // Navy (brand text & headings)
          navy:        '#0D1F3C',
          'navy-soft': '#1A3358',

          // Gold (coin, input borders, login button)
          'gold-light': '#F5CF7A',
          gold:         '#E8B84B',
          'gold-mid':   '#D4A017',
          'gold-dark':  '#B8860B',

          // Green (primary CTA across the whole app)
          green:        '#16A34A',
          'green-light':'#22C55E',
          'green-bg':   '#DCFCE7',  // Light green tint for badges/chips

          // Teal (secondary links: forgot password, sign up)
          teal:         '#0D7A6E',
          'teal-light': '#10A394',

          // Semantic
          red:          '#EF4444',  // Wrong answers, negative transactions
          'red-bg':     '#FEE2E2',  // Light red tint
          muted:        '#6B7280',  // Timestamps, secondary text
          'muted-light':'#9CA3AF',
        },
      },

      // ── Existing overrides (unchanged) ───────────────────────────
      backgroundColor: {
        'light-general': '#F5F7FA',
        'light-card':    '#2D3250',
        'dark-general':  '#1A1D2E',
        'dark-card':     '#2D3250',
      },
      textColor: {
        'card-light': '#FFFFFF',
        'card-muted': '#9CA3AF',
        'cyan':       '#00D9D9',
        'orange':     '#FF9F43',
      },
      borderColor: {
        'cyan':       '#00D9D9',
        'cyan-light': '#4DE8E8',
        'orange':     '#FF9F43',
      },
      ringColor: {
        'cyan': '#00D9D9',
      },

      // ── New font families ─────────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ── Box shadows for cards & buttons ──────────────────────────
      boxShadow: {
        'reads-card':   '0 4px 24px rgba(13,31,60,0.08), 0 1px 4px rgba(13,31,60,0.04)',
        'reads-gold':   '0 4px 16px rgba(180,130,10,0.35)',
        'reads-green':  '0 4px 16px rgba(22,163,74,0.30)',
      },
    },
  },
  plugins: [],
}

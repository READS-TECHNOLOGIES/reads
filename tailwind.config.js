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
        // Custom color palette
        primary: {
          ash: '#D1D5DB',      // Light theme general background (ash gray)
          purple: '#6B21A8',   // Deep purple for cards
          gold: '#F59E0B',     // Gold for fonts and accents
          'gold-light': '#FCD34D', // Lighter gold for hover states
        },
        dark: {
          black: '#0A0A0A',    // Dark theme general background (true black)
          green: '#22C55E',    // Mid-green for cards (not too light, not too dark)
          'green-dark': '#16A34A', // Slightly darker green for hover
          gold: '#F59E0B',     // Gold for fonts
        }
      },
      backgroundColor: {
        // Light theme backgrounds
        'light-general': '#E5E7EB',  // Ash background
        'light-card': '#6B21A8',     // Deep purple cards
        
        // Dark theme backgrounds
        'dark-general': '#0A0A0A',   // Black background
        'dark-card': '#22C55E',      // Mid-green cards
      },
      textColor: {
        'card-gold': '#F59E0B',      // Gold text on cards
      },
      borderColor: {
        'gold': '#F59E0B',           // Gold borders
        'gold-light': '#FCD34D',     // Light gold borders
      },
      ringColor: {
        'gold': '#F59E0B',
      }
    },
  },
  plugins: [],
}
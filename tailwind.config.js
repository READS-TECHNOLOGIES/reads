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
          navy: '#1E3A5F',     // Dark navy blue for cards (makes gold pop!)
          'navy-dark': '#152B47', // Darker navy for hover
          gold: '#F59E0B',     // Gold for fonts
        }
      },
      backgroundColor: {
        // Light theme backgrounds
        'light-general': '#E5E7EB',  // Ash background
        'light-card': '#6B21A8',     // Deep purple cards
        
        // Dark theme backgrounds
        'dark-general': '#0A0A0A',   // Black background
        'dark-card': '#1E3A5F',      // Dark navy blue cards
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
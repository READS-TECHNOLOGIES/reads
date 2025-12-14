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
        // Custom color palette from the mockup design
        primary: {
          // Light mode
          gray: '#F5F7FA',        // Light background
          navy: '#2D3250',        // Dark navy for cards
          'navy-dark': '#1F2937', // Darker navy
          cyan: '#00D9D9',        // Bright cyan/teal accent
          'cyan-dark': '#00B8B8', // Darker cyan
          orange: '#FF9F43',      // Orange for rewards
          'orange-light': '#FFB976',
        },
        dark: {
          // Dark mode
          bg: '#1A1D2E',          // Very dark background
          card: '#2D3250',        // Navy cards
          'card-light': '#3A3F5C', // Lighter navy for hover
          cyan: '#00D9D9',        // Bright cyan accent
          'cyan-glow': '#00FFFF', // Glowing cyan
          orange: '#FF9F43',      // Orange for rewards
        }
      },
      backgroundColor: {
        // Light theme backgrounds
        'light-general': '#F5F7FA',  // Light gray background
        'light-card': '#2D3250',     // Dark navy cards
        
        // Dark theme backgrounds
        'dark-general': '#1A1D2E',   // Very dark navy/black
        'dark-card': '#2D3250',      // Navy cards (same as light for consistency)
      },
      textColor: {
        'card-light': '#FFFFFF',     // White text on cards
        'card-muted': '#9CA3AF',     // Muted gray text
        'cyan': '#00D9D9',           // Cyan text
        'orange': '#FF9F43',         // Orange text
      },
      borderColor: {
        'cyan': '#00D9D9',           // Cyan borders
        'cyan-light': '#4DE8E8',     // Light cyan
        'orange': '#FF9F43',         // Orange borders
      },
      ringColor: {
        'cyan': '#00D9D9',
      }
    },
  },
  plugins: [],
}
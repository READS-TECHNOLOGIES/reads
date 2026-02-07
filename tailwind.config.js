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
        // Sophisticated Dark Navy/Slate for backgrounds and cards
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a', // Main deep background
          950: '#020617', // Darkest accents
        },
        // The signature Cyan/Teal accent color
        accent: {
          light: '#4DE8E8',
          DEFAULT: '#00D9D9',
          dark: '#00B8B8',
          glow: '#00FFFF',
        },
        // The Reward/Token Orange
        reward: {
          light: '#FFB976',
          DEFAULT: '#FF9F43',
          dark: '#E67E22',
        },
        // Semantic background aliases
        surface: {
          light: '#F5F7FA', // Light mode overall bg
          dark: '#1A1D2E',  // Dark mode overall bg
          card: '#2D3250',  // The Navy card color from the mockup
        }
      },
      backgroundImage: {
        'gradient-cyan': 'linear-gradient(135deg, #00D9D9 0%, #00B8B8 100%)',
        'gradient-dark': 'linear-gradient(145deg, #2D3250 0%, #1A1D2E 100%)',
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 217, 217, 0.4)',
        'orange-glow': '0 0 15px rgba(255, 159, 67, 0.4)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
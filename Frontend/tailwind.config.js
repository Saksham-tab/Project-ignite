/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ritual-red': '#fe0101',
        'blood-red': '#7B1E1E',
        'antique-gold': '#CFA849',
        'ash-gray': '#2B2B2B',
        'deep-black': '#0b0b0b',
      },
      fontFamily: {
        'cinzel': ['Cinzel Decorative', 'serif'],
        'cormorant': ['Cormorant Garamond', 'serif'],
        'gothic': ['"UnifrakturCook"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 0.15s infinite linear',
        'blood-drop': 'bloodDrop 3s ease-out forwards',
        'breathing': 'breathing 8s ease-in-out infinite',
        'breathing-reverse': 'breathing-reverse 12s ease-in-out infinite',
        'pulse-red': 'pulseRed 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #fe0101, 0 0 10px #fe0101, 0 0 15px #fe0101' },
          '100%': { boxShadow: '0 0 10px #fe0101, 0 0 20px #fe0101, 0 0 30px #fe0101' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        bloodDrop: {
          '0%': { transform: 'translateY(-100vh) scale(0.1)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '0' },
        },
        breathing: {
          '0%, 100%': {
            opacity: '0.3',
            transform: 'scale(1) rotate(0deg)',
          },
          '50%': {
            opacity: '0.6',
            transform: 'scale(1.1) rotate(2deg)',
          },
        },
        'breathing-reverse': {
          '0%, 100%': {
            opacity: '0.2',
            transform: 'scale(1.05) rotate(0deg)',
          },
          '50%': {
            opacity: '0.4',
            transform: 'scale(0.95) rotate(-1deg)',
          },
        },
        pulseRed: {
          '0%, 100%': {
            backgroundColor: 'rgba(254, 1, 1, 0.1)',
            boxShadow: '0 0 20px rgba(254, 1, 1, 0.3)',
          },
          '50%': {
            backgroundColor: 'rgba(254, 1, 1, 0.2)',
            boxShadow: '0 0 40px rgba(254, 1, 1, 0.5)',
          },
        },
      },
    },
  },
  plugins: [],
  // tailwind.config.js


};

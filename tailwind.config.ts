/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bebas: {
          base: "#B23E3E"
        },
        retro: {
          cream: '#F5E6C8',
          brown: '#4A2C17',
          amber: '#D4850A',
          rust: '#A63C1A',
          green: '#3B5E3A',
        },
      },
      fontFamily: {
        retro: ['"Press Start 2P"', 'monospace'],
        display: ['"VT323"', 'monospace'],
        body: ['"IBM Plex Mono"', 'monospace'],
        gaming: ['"Retro Gaming"', 'regular'],   // self-hosted — src/assets/fonts/RetroGaming.ttf
        bebas: ['"Bebas Neue"', 'sans-serif'],      // Google Fonts
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app.html",
    "./src/**/*.{svelte,mjs,js}",
  ],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
    colors: {
      slate: {
        900: '#0f172a',
        800: '#172033',
        700: '#28354b',
        600: '#4a5568',
        500: '#718096',
        400: '#a0aec0',
        300: '#cbd5e0',
        200: '#e2e8f0',
        100: '#edf2f7',
        50: '#f7fafc'
      },
      neon: {
        green: '#bbff00',
        'green-dark': '#9acf08',
        pink: '#ff1493',
        'pink-dark': '#e01383',
        blue: '#22d5ff',
        orange: '#ff9f22',
        'orange-dark': '#e08f1e',
      }
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
      sleek: ['Inter', 'Roboto', 'sans-serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: [],
};

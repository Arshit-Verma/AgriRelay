/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2D6A4F',
        accent: '#F4A261',
        alert: '#E63946',
        surface: '#F8F9F2',
        dark: '#1B1B1B',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        badge: '24px',
      },
    },
  },
  plugins: [],
};

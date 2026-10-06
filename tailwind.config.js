/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          primary: '#4F7185',
          'primary-dark': '#3b5665',
          'primary-light': '#6c8fa2',
          secondary: '#DCEBF0',
          'secondary-light': '#edf5f8',
          bg: '#F7FAFB',
          white: '#FFFFFF',
          text: '#172B36',
          muted: '#6B7F89',
          success: '#4CAF7D',
          warning: '#E9A84C',
          danger: '#D96565'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(23, 43, 54, 0.04)',
        'card': '0 4px 20px rgba(79, 113, 133, 0.08)',
        'modal': '0 10px 40px rgba(23, 43, 54, 0.15)'
      }
    },
  },
  plugins: [],
}

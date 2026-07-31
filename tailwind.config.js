/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1220',
        'background-secondary': '#111827',
        'background-tertiary': '#1F2937',
        surface: '#111827',
        'surface-hover': '#1F2937',
        border: 'rgba(148, 163, 184, 0.12)',
        'border-hover': 'rgba(59, 130, 246, 0.25)',
        primary: '#3B82F6',
        'primary-dark': '#2563EB',
        secondary: '#22D3EE',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-heading': '#F9FAFB',
        'text-body': '#E5E7EB',
        'text-muted': '#94A3B8'
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        'background-secondary': '#111113',
        'background-tertiary': '#18181b',
        surface: '#1c1c1f',
        'surface-hover': '#27272a',
        border: 'rgba(255, 255, 255, 0.06)',
        'border-hover': 'rgba(59, 130, 246, 0.4)',
        primary: '#3b82f6',
        'primary-dark': '#2563eb',
        secondary: '#06b6d4',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        'text-heading': '#fafafa',
        'text-body': '#a1a1aa',
        'text-muted': '#71717a'
      },
      borderRadius: {
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
      },
    },
  },
  plugins: [],
}
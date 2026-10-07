import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--dp-primary) / <alpha-value>)',
          dark: 'rgb(var(--dp-primary-dark) / <alpha-value>)',
        },
        navy: 'rgb(var(--dp-navy) / <alpha-value>)',
        charcoal: 'rgb(var(--dp-charcoal) / <alpha-value>)',
        success: 'rgb(var(--dp-success) / <alpha-value>)',
        warning: 'rgb(var(--dp-warning) / <alpha-value>)',
        danger: 'rgb(var(--dp-danger) / <alpha-value>)',
      },
      borderRadius: {
        md: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config;

import animate from 'tailwindcss-animate';
const c = (n) => `hsl(var(--${n}))`;
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      colors: {
        background: c('background'), foreground: c('foreground'),
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        popover: { DEFAULT: c('popover'), foreground: c('popover-foreground') },
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        destructive: { DEFAULT: c('destructive'), foreground: c('destructive-foreground') },
        border: c('border'), input: c('input'), ring: c('ring'),
      },
      fontFamily: {
        heading: ['var(--font-heading)'], body: ['var(--font-body)'],
        display: ['var(--font-display)'], mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [animate],
};

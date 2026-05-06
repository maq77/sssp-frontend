/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'kpi-xl': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
        'kpi-lg': ['1.875rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
        'kpi-md': ['1.5rem', { lineHeight: '1', letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Semantic threat colors */
        threat: {
          critical: 'hsl(var(--threat-critical))',
          high:     'hsl(var(--threat-high))',
          medium:   'hsl(var(--threat-medium))',
          low:      'hsl(var(--threat-low))',
          info:     'hsl(var(--threat-info))',
        },
        cam: {
          online:   'hsl(var(--cam-online))',
          offline:  'hsl(var(--cam-offline))',
          degraded: 'hsl(var(--cam-degraded))',
        },
        surface: {
          0: 'hsl(var(--surface-0))',
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
          3: 'hsl(var(--surface-3))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in':      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-in':     { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'slide-up':     { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'slide-right':  { '0%': { transform: 'translateX(-10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        'pulse-glow':   { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        'bounce-in':    { '0%': { transform: 'scale(0.8)', opacity: '0' }, '60%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'live-ring':    { '0%': { transform: 'scale(1)', opacity: '0.8' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        'scan-sweep':   { '0%': { top: '0%' }, '100%': { top: '100%' } },
        'threat-pulse': { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.55', transform: 'scale(1.06)' } },
        'glow-ring':    { '0%': { transform: 'scale(1)', opacity: '0.6' }, '100%': { transform: 'scale(1.8)', opacity: '0' } },
        'count-up':     { 'from': { opacity: '0', transform: 'translateY(8px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
        'shimmer':      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in':       'fade-in 0.3s ease-out',
        'slide-in':      'slide-in 0.3s ease-out',
        'slide-up':      'slide-up 0.3s ease-out',
        'slide-right':   'slide-right 0.3s ease-out',
        'pulse-glow':    'pulse-glow 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-in':     'bounce-in 0.45s ease-out',
        'live-ring':     'live-ring 2s ease-out infinite',
        'scan-sweep':    'scan-sweep 4s linear infinite',
        'threat-pulse':  'threat-pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-ring':     'glow-ring 2s ease-out infinite',
        'count-up':      'count-up 0.4s ease-out',
        'shimmer':       'shimmer 2s linear infinite',
      },
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(59,130,246,0.35)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.35)',
        'glow-green':  '0 0 20px rgba(34,197,94,0.35)',
        'glow-amber':  '0 0 20px rgba(245,158,11,0.35)',
        'card-hover':  '0 12px 32px rgba(0,0,0,0.4)',
        'panel':       '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};

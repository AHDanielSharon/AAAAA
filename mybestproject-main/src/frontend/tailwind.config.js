import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['index.html', 'src/**/*.{js,ts,jsx,tsx,html,css}'],
    theme: {
        // No container defaults — mobile-first full-width layout
        extend: {
            screens: {
                xs: '375px',
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
                '2xl': '1536px',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Space Grotesk', 'system-ui', 'sans-serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                border: 'oklch(var(--border) / <alpha-value>)',
                input: 'oklch(var(--input) / <alpha-value>)',
                ring: 'oklch(var(--ring) / <alpha-value>)',
                background: 'oklch(var(--background) / <alpha-value>)',
                foreground: 'oklch(var(--foreground) / <alpha-value>)',
                primary: {
                    DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
                    foreground: 'oklch(var(--primary-foreground) / <alpha-value>)'
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
                    foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)'
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
                    foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)'
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
                    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
                    foreground: 'oklch(var(--accent-foreground) / <alpha-value>)'
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
                    foreground: 'oklch(var(--popover-foreground) / <alpha-value>)'
                },
                card: {
                    DEFAULT: 'oklch(var(--card) / <alpha-value>)',
                    foreground: 'oklch(var(--card-foreground) / <alpha-value>)'
                },
            },
            boxShadow: {
                'premium-sm': '0 4px 12px rgba(0, 0, 0, 0.05)',
                'premium-md': '0 12px 24px rgba(0, 0, 0, 0.08)',
                'premium-lg': '0 24px 48px rgba(0, 0, 0, 0.12)',
                'glass-sm': '0 4px 12px var(--glass-border)',
                'glass-md': '0 12px 24px var(--glass-border)',
                'glass-lg': '0 24px 48px var(--glass-border)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'gradient-shift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' }
                },
                'neon-pulse': {
                    '0%, 100%': {
                        boxShadow: '0 0 10px oklch(var(--primary) / 0.5), 0 0 20px oklch(var(--primary) / 0.3)'
                    },
                    '50%': {
                        boxShadow: '0 0 20px oklch(var(--primary) / 0.7), 0 0 30px oklch(var(--primary) / 0.5)'
                    }
                },
                'glow-pulse': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' }
                },
                'spring-in': {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to: { opacity: '1', transform: 'scale(1)' }
                },
                'spring-out': {
                    from: { opacity: '1', transform: 'scale(1)' },
                    to: { opacity: '0', transform: 'scale(0.95)' }
                },
                'floating': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' }
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)' }
                },
                'fade-in-spring': {
                    from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' }
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' }
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' }
                },
                'scale-in': {
                    from: { opacity: '0', transform: 'scale(0.9)' },
                    to: { opacity: '1', transform: 'scale(1)' }
                },
                'slide-down': {
                    from: { opacity: '0', transform: 'translateY(-12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' }
                },
                'cyber-radar': {
                    '0%': { transform: 'scale(1)', opacity: '1' },
                    '100%': { transform: 'scale(3)', opacity: '0' }
                },
                'cyber-scan': {
                    '0%': { clipPath: 'inset(0 0 100% 0)' },
                    '100%': { clipPath: 'inset(0 0 0 0)' }
                },
                'danger-pulse': {
                    '0%, 100%': { boxShadow: '0 0 15px oklch(var(--cyber-dangerous) / 0.4), 0 0 30px oklch(var(--cyber-dangerous) / 0.2)' },
                    '50%': { boxShadow: '0 0 25px oklch(var(--cyber-dangerous) / 0.7), 0 0 50px oklch(var(--cyber-dangerous) / 0.4)' }
                },
                'safe-pulse': {
                    '0%, 100%': { boxShadow: '0 0 15px oklch(var(--cyber-safe) / 0.4), 0 0 30px oklch(var(--cyber-safe) / 0.2)' },
                    '50%': { boxShadow: '0 0 25px oklch(var(--cyber-safe) / 0.7), 0 0 50px oklch(var(--cyber-safe) / 0.4)' }
                },
                'warning-pulse': {
                    '0%, 100%': { boxShadow: '0 0 15px oklch(var(--cyber-moderate) / 0.4), 0 0 30px oklch(var(--cyber-moderate) / 0.2)' },
                    '50%': { boxShadow: '0 0 25px oklch(var(--cyber-moderate) / 0.7), 0 0 50px oklch(var(--cyber-moderate) / 0.4)' }
                },
                'shield-glow': {
                    '0%, 100%': { filter: 'drop-shadow(0 0 10px oklch(var(--primary) / 0.6))' },
                    '50%': { filter: 'drop-shadow(0 0 20px oklch(var(--primary) / 1))' }
                },
                'threat-blink': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'gradient-shift': 'gradient-shift 15s ease infinite',
                'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'spring-in': 'spring-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'spring-out': 'spring-out 400ms cubic-bezier(0.36, 0, 0.66, -0.56)',
                'floating': 'floating 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'fade-in-spring': 'fade-in-spring 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'slide-up': 'slide-up 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'fade-in': 'fade-in 300ms ease-out',
                'scale-in': 'scale-in 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'slide-down': 'slide-down 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                'cyber-radar': 'cyber-radar 2s ease-out infinite',
                'cyber-scan': 'cyber-scan 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'danger-pulse': 'danger-pulse 1.5s ease-in-out infinite',
                'safe-pulse': 'safe-pulse 1.5s ease-in-out infinite',
                'warning-pulse': 'warning-pulse 1.5s ease-in-out infinite',
                'shield-glow': 'shield-glow 2s ease-in-out infinite',
                'threat-blink': 'threat-blink 1s ease-in-out infinite'
            }
        }
    },
    plugins: [typography, containerQueries, animate]
};

// tailwind.config.js
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          // Elegant dark surface colors with depth
          surface: {
            950: '#0A0B0F', // Deep charcoal - almost black but warmer
            900: '#12141A', // Rich dark background  
            800: '#1A1D26', // Elevated surfaces
            700: '#252A38', // Mid-tone surfaces
            600: '#2F3549', // Interactive surfaces
            500: '#3D4459', // Borders and dividers
          },
          // Sophisticated neutral grays
          neutral: {
            900: '#0F1419', // Text on light backgrounds
            800: '#1C2128', // Secondary text
            700: '#2D3748', // Muted text
            600: '#4A5568', // Placeholder text
            500: '#718096', // Disabled text
            400: '#A0AEC0', // Subtle text
            300: '#CBD5E0', // Light text on dark
            200: '#E2E8F0', // Very light text
            100: '#F7FAFC', // Almost white
            50: '#FDFDFE',  // Pure light
          },
          // Rich accent colors for elegance
          primary: {
            900: '#1A365D', // Deep blue
            800: '#2A4A6B', // Rich blue  
            700: '#2C5F7B', // Sophisticated blue
            600: '#2E748B', // Primary blue
            500: '#3182CE', // Bright blue
            400: '#4299E1', // Light blue
            300: '#63B3ED', // Soft blue
            200: '#90CDF4', // Very light blue
            100: '#BEE3F8', // Pale blue
            50: '#EBF8FF',  // Almost white blue
          },
          // Warm accent for energy
          accent: {
            900: '#7C2D12', // Deep amber
            800: '#9A3412', // Rich amber
            700: '#C2410C', // Warm amber  
            600: '#EA580C', // Primary amber
            500: '#F59E0B', // Bright amber
            400: '#FBBF24', // Light amber
            300: '#FCD34D', // Soft amber
            200: '#FDE68A', // Very light amber
            100: '#FEF3C7', // Pale amber
            50: '#FFFBEB',  // Almost white amber
          },
          // Success and status colors
          success: {
            900: '#14532D', // Deep green
            800: '#166534', // Rich green
            700: '#15803D', // Primary green
            600: '#16A34A', // Bright green
            500: '#22C55E', // Light green
            400: '#4ADE80', // Soft green
            300: '#86EFAC', // Very light green
            200: '#BBF7D0', // Pale green
            100: '#DCFCE7', // Almost white green
          },
          // Elegant purple for highlights
          violet: {
            900: '#4C1D95', // Deep violet
            800: '#5B21B6', // Rich violet
            700: '#6D28D9', // Primary violet  
            600: '#7C3AED', // Bright violet
            500: '#8B5CF6', // Light violet
            400: '#A78BFA', // Soft violet
            300: '#C4B5FD', // Very light violet
            200: '#DDD6FE', // Pale violet
            100: '#EDE9FE', // Almost white violet
          },
          // Warning and error colors
          warning: {
            600: '#D97706', // Primary warning
            500: '#F59E0B', // Light warning
            400: '#FBBF24', // Soft warning
          },
          error: {
            600: '#DC2626', // Primary error
            500: '#EF4444', // Light error
            400: '#F87171', // Soft error
          }
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui'],
          mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        },
        borderRadius: {
          xl: '1rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
        },
        boxShadow: {
          'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
          'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.15)',
          'glass-xl': '0 20px 60px rgba(0, 0, 0, 0.2)',
          'inner-glass': 'inset 0 1px 4px rgba(255, 255, 255, 0.1)',
          'glow': '0 0 20px rgba(49, 130, 206, 0.4)',
          'glow-lg': '0 0 40px rgba(49, 130, 206, 0.3)',
          'warm-glow': '0 0 20px rgba(245, 158, 11, 0.4)',
        },
        backdropBlur: {
          'xs': '2px',
          'sm': '4px',
          'md': '8px',
          'lg': '16px',
          'xl': '24px',
          '2xl': '40px',
          '3xl': '64px',
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-in-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          pulseGlow: {
            '0%, 100%': { boxShadow: '0 0 20px rgba(49, 130, 206, 0.4)' },
            '50%': { boxShadow: '0 0 40px rgba(49, 130, 206, 0.6)' },
          },
        },
      },
    },
    plugins: [],
  };
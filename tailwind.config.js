/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        mg: {
          blue: '#0086FF',
          'blue-dark': '#0067C5',
        },
        ml: {
          yellow: '#FFE600',
          'yellow-dark': '#F7C600',  // antes: '#E6CF00' — ajustado para spec
          blue: '#3483FA',
          'blue-dark': '#2968C8',
          green: '#00A650',
          'green-dark': '#007A3D',
        },
        sidebar: {
          bg: '#07111F',
          surface: '#101B2D',
        },
        surface: {
          page: '#F6F7F3',
          card: '#FFFFFF',
        },
        'border-subtle': '#E6E8DF',
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
          purple: '#8B5CF6',
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        elevated: '0 4px 16px -2px rgb(0 0 0 / 0.08)',
      },
      animation: {
        // mantém animações existentes
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'idle-bob': 'idleBob 3s ease-in-out infinite',
        'uf-blink': 'ufBlink 0.7s ease-in-out 3',
        'curve-halo': 'curveHalo 2.4s ease-in-out infinite',
        // Animações semânticas dos ícones da sidebar (1× no hover do expandido)
        'icon-ring': 'iconRing 0.6s ease-in-out',
        'icon-tremor': 'iconTremor 0.4s ease-in-out',
        'icon-spin': 'iconSpin 0.7s ease-in-out',
        'icon-wiggle': 'iconWiggle 0.5s ease-in-out',
        'icon-rise': 'iconRise 0.5s ease-out',
        'icon-pulse': 'iconPulse 0.6s ease-in-out',
        'icon-nod': 'iconNod 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        slideInRight: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        slideDown: { '0%': { opacity: '0', maxHeight: '0' }, '100%': { opacity: '1', maxHeight: '500px' } },
        idleBob: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-3px)' } },
        ufBlink: { '0%, 100%': { filter: 'brightness(1)' }, '50%': { filter: 'brightness(2.1)' } },
        curveHalo: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.45' },
          '50%': { transform: 'scale(1.7)', opacity: '0' },
        },
        // Sino balança (Alertas)
        iconRing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(12deg)' },
          '40%': { transform: 'rotate(-10deg)' },
          '60%': { transform: 'rotate(6deg)' },
          '80%': { transform: 'rotate(-3deg)' },
        },
        // Tremor (Reclamações)
        iconTremor: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-1.5px)' },
          '40%, 80%': { transform: 'translateX(1.5px)' },
        },
        // Gira 360 (Configurações / Promoções)
        iconSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Chacoalha (Campanhas / megafone)
        iconWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '75%': { transform: 'rotate(-6deg)' },
        },
        // Sobe com bounce (Previsões)
        iconRise: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
          '70%': { transform: 'translateY(-1px)' },
          '100%': { transform: 'translateY(0)' },
        },
        // Pulsa (Vendas Hoje)
        iconPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.18)' },
        },
        // Acena / nod (Agente IA)
        iconNod: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(2px)' },
          '50%': { transform: 'translateY(0)' },
          '75%': { transform: 'translateY(2px)' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f1f3f0',
        paper: { DEFAULT: '#ffffff', 2: '#f6f8f5', 3: '#edf0ea' },
        ink: { DEFAULT: '#151a13', soft: '#4f584c', faint: '#838c7f' },
        line: { DEFAULT: '#e5e8e1', strong: '#d2d7cc' },
        grass: { DEFAULT: '#3f8f2c', deep: '#2c6b22', soft: '#edf5e8', ink: '#1d3b16', live: '#74b73c' },
        sun: { DEFAULT: '#e3851d', deep: '#b96810', soft: '#fbeed9', ink: '#7a4310' },
        info: { DEFAULT: '#2f6f8f', soft: '#e6f0f4' },
        danger: { DEFAULT: '#b3402e', soft: '#f7e7e3' },
        // tiefes Grün-Schwarz für den eingegrenzten Dunkel-Moment (Hero-Strompanel)
        night: { DEFAULT: '#10201a', 2: '#172c24', soft: '#26392f', line: '#2c4137' },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display': ['clamp(2.2rem, 4.5vw, 3.6rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-sm': ['clamp(1.7rem, 3vw, 2.4rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },
      borderRadius: { card: '14px', 'card-lg': '20px', pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgba(20,30,15,.04), 0 6px 16px -10px rgba(20,30,15,.12)',
        'card-hover': '0 2px 6px rgba(20,30,15,.05), 0 18px 36px -18px rgba(20,40,15,.20)',
        raise: '0 10px 30px -14px rgba(20,40,15,.30)',
        pop: '0 24px 60px -22px rgba(20,40,15,.38)',
        glow: '0 14px 50px -14px rgba(120,160,40,.45)',
        'glow-sun': '0 14px 50px -14px rgba(227,133,29,.5)',
      },
      maxWidth: { content: '1200px', prose2: '68ch' },
      keyframes: {
        risein: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        charge: { '0%': { transform: 'scaleY(0)' }, '100%': { transform: 'scaleY(1)' } },
        chargeX: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        glowpulse: { '0%,100%': { opacity: 0.55 }, '50%': { opacity: 1 } },
        flowdown: { '0%': { backgroundPosition: '0 -40px' }, '100%': { backgroundPosition: '0 40px' } },
      },
      animation: {
        risein: 'risein .45s cubic-bezier(.2,.7,.2,1) both',
        charge: 'charge .9s cubic-bezier(.2,.7,.2,1) both',
        chargeX: 'chargeX .8s cubic-bezier(.2,.7,.2,1) both',
        glowpulse: 'glowpulse 3.5s ease-in-out infinite',
        flowdown: 'flowdown 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};

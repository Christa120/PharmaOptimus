import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lagune: '#0B2E33',
        palme: '#1F7A4D',
        kaolin: '#F1F4F2',
        brume: '#CFD9D5',
        soleil: '#E3A92B',
        signal: '#C8372D',
        alerte: '#E07B1F',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body: ['Instrument Sans', 'sans-serif'],
      },
      animation: {
        'ping-once': 'ping 1s cubic-bezier(0, 0, 0.2, 1) 1',
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ford Official Brand Colors
        'ford-blue': {
          DEFAULT: '#003478', // Ford Primary Blue
          50: '#E6EDF7',
          100: '#C2D5EC',
          200: '#99BBE0',
          300: '#70A1D4',
          400: '#4D8CCA',
          500: '#003478', // Primary
          600: '#002D66',
          700: '#002554',
          800: '#001D42',
          900: '#001530',
        },
        'ford-light-blue': {
          DEFAULT: '#00B4D8',
          50: '#E5F7FB',
          100: '#B8EAF5',
          200: '#8ADCEE',
          300: '#5CCEE7',
          400: '#2EC0E0',
          500: '#00B4D8',
          600: '#009BB8',
          700: '#007A92',
          800: '#00596C',
          900: '#003846',
        },
        'ford-gray': {
          DEFAULT: '#6C757D',
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#0D1117',
        },
        'ford-red': {
          DEFAULT: '#E30613', // Ford Red
          50: '#FEE7E9',
          100: '#FCC4C7',
          200: '#FA9EA2',
          300: '#F7787D',
          400: '#F55C61',
          500: '#E30613',
          600: '#C70510',
          700: '#A1040D',
          800: '#7B030A',
          900: '#550206',
        },
        'ford-orange': {
          DEFAULT: '#FF6B35',
          50: '#FFE9E3',
          100: '#FFD0C3',
          200: '#FFB39F',
          300: '#FF967B',
          400: '#FF8158',
          500: '#FF6B35',
          600: '#E6541D',
          700: '#BD4217',
          800: '#943311',
          900: '#6B240C',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'ford': ['Antenna', 'Arial', 'Helvetica', 'sans-serif'],
        'ford-condensed': ['Antenna Condensed', 'Arial Narrow', 'sans-serif'],
      },
      backgroundImage: {
        'ford-gradient': 'linear-gradient(135deg, #003478 0%, #00B4D8 100%)',
        'ford-gradient-dark': 'linear-gradient(135deg, #001D42 0%, #007A92 100%)',
        'ford-gradient-red': 'linear-gradient(135deg, #E30613 0%, #FF6B35 100%)',
      },
      boxShadow: {
        'ford': '0 4px 6px -1px rgba(0, 52, 120, 0.1), 0 2px 4px -1px rgba(0, 52, 120, 0.06)',
        'ford-lg': '0 10px 15px -3px rgba(0, 52, 120, 0.1), 0 4px 6px -2px rgba(0, 52, 120, 0.05)',
        'ford-xl': '0 20px 25px -5px rgba(0, 52, 120, 0.1), 0 10px 10px -5px rgba(0, 52, 120, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;

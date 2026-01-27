/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(0 0% 89%)',
        input: 'hsl(0 0% 89%)',
        ring: 'hsl(0 0% 63%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 0%)',
        primary: {
          DEFAULT: 'hsl(0 0% 9%)',
          foreground: 'hsl(0 0% 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 96%)',
          foreground: 'hsl(0 0% 9%)',
        },
        muted: {
          DEFAULT: 'hsl(0 0% 96%)',
          foreground: 'hsl(0 0% 45%)',
        },
        accent: {
          DEFAULT: 'hsl(0 0% 96%)',
          foreground: 'hsl(0 0% 9%)',
        },
      },
      borderRadius: {
        lg: '20px',
        md: '16px',
        sm: '12px',
      },
    },
  },
  plugins: [],
}

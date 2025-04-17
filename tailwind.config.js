module.exports = {
    content: [
      './src/app/**/*.{js,ts,jsx,tsx}',
      './src/components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        keyframes: {
          fadeInUp: {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          wiggle: {
            '0%, 100%': { transform: 'rotate(-3deg)' },
            '50%': { transform: 'rotate(3deg)' },
          },
          pulseOnce: {
            '0%': { transform: 'scale(1)', opacity: 0.8 },
            '50%': { transform: 'scale(1.05)', opacity: 1 },
            '100%': { transform: 'scale(1)', opacity: 0.8 },
          },
        },
        animation: {
          fadeInUp: 'fadeInUp 0.6s ease-out',
          wiggle: 'wiggle 0.5s ease-in-out',
          pulseOnce: 'pulseOnce 0.6s ease-in-out',
        },
      },
    },
    plugins: [],
  }
  
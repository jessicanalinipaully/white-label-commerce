/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary, #4F46E5)",
          hover: "var(--color-primary-hover, #4338CA)",
        },
        secondary: "var(--color-secondary, #06B6D4)",
        accent: "var(--color-accent, #F59E0B)",
      },
      borderRadius: {
        theme: "var(--radius, 0.75rem)",
      },
    },
  },
  plugins: [],
};

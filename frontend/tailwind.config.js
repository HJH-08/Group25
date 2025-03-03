/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Ensures Tailwind scans all relevant files
  ],
  theme: {
    extend: {}, // Customize your theme here if needed
  },
  plugins: [], // Add plugins if necessary
};

export default tailwindConfig;

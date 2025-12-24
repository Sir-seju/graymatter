/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    // require('@tailwindcss/typography'), // Require is CJS, might fail in ESM context if project is ESM. 
    // Let's stick to CJS for config files if package.json doesn't say "type": "module".
  ],
}

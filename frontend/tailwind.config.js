/**
 * Tailwind config.
 * `content` tells Tailwind which files to scan for class names so unused styles get tree-shaken.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Subtle brand accent — used sparingly in shells/headers. The bulk of
        // the UI uses Material's theme so we don't fight it.
        brand: {
          50:  '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    },
  },
  plugins: [],
  // Disable Tailwind's preflight (CSS reset) so it doesn't clobber Material's defaults.
  corePlugins: {
    preflight: false,
  },
};

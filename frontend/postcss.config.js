// PostCSS pipeline used by Angular's builder.
// Tailwind first (generates utility classes), Autoprefixer last (adds vendor prefixes).
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

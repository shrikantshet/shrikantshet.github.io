module.exports = {
  purge: ['./index.html', './css/styles.css'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        darkBlue: { DEFAULT: '#313C4E' },
        greenBlue: { DEFAULT: '#449399' },
        lightGrey: { DEFAULT: '#C0C0C0' },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

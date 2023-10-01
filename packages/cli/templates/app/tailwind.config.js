/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{vue,ts}', '<% &contentPath %>'],
    plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

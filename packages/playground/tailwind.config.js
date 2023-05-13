/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{vue,ts}'],
    plugins: [require('@tailwindcss/forms')],
};

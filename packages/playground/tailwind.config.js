/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{vue,ts}', '../core/src/**/*.{vue,ts}'],
    plugins: [require('@tailwindcss/forms')],
};

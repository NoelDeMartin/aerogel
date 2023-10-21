/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{vue,ts}', '../core/src/**/*.{vue,ts}'],
    plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
    theme: {
        extend: {
            colors: {
                'red-grey': '#ecdcdc',
            },
            width: {
                clickable: '42px',
            },
            height: {
                clickable: '42px',
            },
        },
    },
};

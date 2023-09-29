/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './src/**/*.{vue,ts}',
        '<% #local %><% &local.aerogelPath %>/core/dist/**/*.js<% /local %><% ^local %>./node_modules/@aerogel/core/dist/**/*.js<% /local %>',
    ],
    plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

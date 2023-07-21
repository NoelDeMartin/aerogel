const plugins = {
    tailwindcss: {},
    autoprefixer: {},
};

if (process.env.NODE_ENV === 'development') {
    plugins['postcss-pseudo-classes'] = {
        blacklist: [],
        restrictTo: ['hover', 'focus-visible', 'focus'],
        allCombinations: true,
        preserveBeforeAfter: false,
    };
}

module.exports = { plugins };

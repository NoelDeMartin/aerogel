import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Aerogel',
    description: 'The Lightest Solid',
    outDir: './dist',
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'Playground', link: 'https://aerogel.js.org/playground/' },
        ],
        socialLinks: [{ icon: 'github', link: 'https://github.com/noeldemartin/aerogel' }],
    },
});

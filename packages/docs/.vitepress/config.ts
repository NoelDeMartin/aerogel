import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Aerogel',
    description: 'The Lightest Solid',
    outDir: './dist',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/' },
        ],
        socialLinks: [{ icon: 'github', link: 'https://github.com/noeldemartin/aerogel' }],
    },
});

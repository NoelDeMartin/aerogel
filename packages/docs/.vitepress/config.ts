import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Aerogel',
    description: 'The Lightest Solid',
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/' },
        ],
        socialLinks: [{ icon: 'github', link: 'https://github.com/noeldemartin/aerogel' }],
    },
});

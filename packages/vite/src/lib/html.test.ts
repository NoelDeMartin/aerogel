import { describe, expect, it } from 'vitest';
import { formatCodeBlock } from '@noeldemartin/utils';

import type { AppInfo } from '@/lib/options';

import { renderHTML } from './html';

describe('HTML helpers', () => {

    const app: AppInfo = {
        name: 'My App',
        basePath: '/site/',
        themeColor: '#654321',
    };

    it('Evaluates app info', () => {
        // Arrange
        const html = '<title>{{ app.name }}</title>';
        const expected = '<title>My App</title>';

        // Act
        const actual = renderHTML(html, '/var/www/index.html', app);

        // Assert
        expect(actual).toEqual(expected);
    });

    it('Evaluates asset helpers', () => {
        // Arrange
        const html = `
            {{ css('./inline-styles.css') }}
            {{ js('./inline-script.js') }}
            {{ svg('./inline-svg.svg') }}
        `;
        const expected = `
            <style>file-source[/var/www/inline-styles.css]</style>
            <script>file-source[/var/www/inline-script.js]</script>
            file-source[/var/www/inline-svg.svg]
        `;

        // Act
        const actual = renderHTML(html, '/var/www/index.html', app);

        // Assert
        expect(actual).toEqual(expected);
    });

    it('Evaluates meta helpers', () => {
        // Arrange
        const html = `
            {{ favicons({ maskIconColor: '#123456' }) }}
            {{ socialMeta() }}
        `;
        const expected = formatCodeBlock(`
            <link rel="apple-touch-icon" sizes="180x180" href="/site/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/site/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/site/favicon-16x16.png" />
            <link rel="mask-icon" href="/site/safari-pinned-tab.svg" color="#123456" />


            <meta name="apple-mobile-web-app-title" content="My App" />
            <meta name="application-name" content="My App" />
            <meta name="msapplication-TileColor" content="#654321" />
            <meta name="theme-color" content="#654321" />
            <meta property="og:title" content="My App" />
            <meta property="og:type" content="website" />
        `);

        // Act
        const actual = renderHTML(html, '/var/www/index.html', app);

        // Assert
        expect(formatCodeBlock(actual)).toEqual(expected);
    });

});

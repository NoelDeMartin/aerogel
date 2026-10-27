import { describe, expect, it } from 'vite-plus/test';

import { renderMarkdown, renderMarkdownAsText } from './markdown';

describe('Markdown utils', () => {
    it('renders basic markdown', () => {
        // Arrange
        const expectedHTML = `
            <h1>Title</h1>
            <p>body with <a target="_blank" href="https://example.com">link</a></p>
            <ul>
                <li>One</li>
                <li>Two</li>
                <li>Three</li>
            </ul>
        `;

        // Act
        const html = renderMarkdown(
            ['# Title', 'body with [link](https://example.com)', '- One', '- Two', '- Three'].join('\n'),
        );

        // Assert
        expect(normalizeHTML(html)).toMatch(new RegExp(normalizeHTML(expectedHTML)));
    });

    it('renders button links', () => {
        // Arrange
        const expectedHTML = `
            <p><button type="button" data-markdown-action="do-something">link</button></p>
        `;

        // Act
        const html = renderMarkdown('[link](#action:do-something)');

        // Assert
        expect(normalizeHTML(html)).toMatch(new RegExp(normalizeHTML(expectedHTML)));
    });

    it('renders markdown as text', () => {
        // Arrange
        const markdown = [
            '# Title',
            '',
            'Recommended by **Alice** and _Bob_, \\*not emphasized\\* `a*b*`.',
            'See [Alien](https://en.wikipedia.org/wiki/Alien_(film)) or https://example.com/some_page_name',
            '',
            '- One',
            '- Two **bold**',
            '',
            '3. Three',
            '4. Four',
            '',
            '> Quote',
            '',
            '![Poster](https://example.com/poster.jpg)',
        ].join('\n');

        // Act
        const text = renderMarkdownAsText(markdown);

        // Assert
        expect(text).toEqual(
            [
                'Title',
                '',
                'Recommended by Alice and Bob, *not emphasized* a*b*.',
                'See Alien or https://example.com/some_page_name',
                '',
                '• One',
                '• Two bold',
                '',
                '3. Three',
                '4. Four',
                '',
                'Quote',
            ].join('\n'),
        );
    });
});

function normalizeHTML(html: string): string {
    return html
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}

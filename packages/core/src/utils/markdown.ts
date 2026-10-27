import { stringMatchAll, tap } from '@noeldemartin/utils';
import DOMPurify from 'dompurify';
import { Renderer, marked } from 'marked';
import type { Token, Tokens } from 'marked';

let router: MarkdownRouter | null = null;

function makeRenderer(): Renderer {
    return tap(new Renderer(), (renderer) => {
        renderer.link = function (link) {
            const defaultLink = Renderer.prototype.link.apply(this, [link]);

            if (!link.href.startsWith('#')) {
                return defaultLink.replace('<a', '<a target="_blank"');
            }

            return defaultLink;
        };
    });
}

function renderActionLinks(html: string): string {
    const matches = stringMatchAll<3>(html, /<a[^>]*href="#action:([^"]+)"[^>]*>([^<]+)<\/a>/g);

    for (const [link, action, text] of matches) {
        html = html.replace(link, `<button type="button" data-markdown-action="${action}">${text}</button>`);
    }

    return html;
}

function renderRouteLinks(html: string): string {
    const matches = stringMatchAll<3>(html, /<a[^>]*href="#route:([^"]+)"[^>]*>([^<]+)<\/a>/g);

    for (const [link, route, text] of matches) {
        const url = router?.resolve(route) ?? route;

        html = html.replace(link, `<a data-markdown-route="${route}" href="${url}">${text}</a>`);
    }

    return html;
}

function renderBlockTokensAsText(tokens: Token[], separator: string = '\n\n'): string {
    return tokens
        .map(renderTokenAsText)
        .filter((text) => text.length > 0)
        .join(separator);
}

function renderInlineTokensAsText(tokens: Token[]): string {
    return tokens.map(renderTokenAsText).join('');
}

function renderListAsText(list: Tokens.List): string {
    const start = typeof list.start === 'number' ? list.start : 1;

    return list.items
        .map((item, index) => {
            const bullet = list.ordered ? `${start + index}.` : '•';

            return `${bullet} ${renderBlockTokensAsText(item.tokens, '\n')}`;
        })
        .join('\n');
}

function renderTableAsText(table: Tokens.Table): string {
    return [table.header, ...table.rows]
        .map((cells) => cells.map((cell) => renderInlineTokensAsText(cell.tokens)).join(' | '))
        .join('\n');
}

function renderTokenAsText(token: Token): string {
    switch (token.type) {
        case 'space':
        case 'hr':
        case 'def':
        case 'html':
        case 'image':
            return '';
        case 'br':
            return '\n';
        case 'list':
            return renderListAsText(token as Tokens.List);
        case 'table':
            return renderTableAsText(token as Tokens.Table);
        case 'blockquote':
            return renderBlockTokensAsText(token.tokens ?? []);
    }

    if ('tokens' in token && token.tokens) {
        return renderInlineTokensAsText(token.tokens);
    }

    return 'text' in token && typeof token.text === 'string' ? token.text : '';
}

export interface MarkdownRouter {
    resolve(route: string): string;
    visit(route: string): Promise<void>;
}

export function getMarkdownRouter(): MarkdownRouter | null {
    return router;
}

export function setMarkdownRouter(markdownRouter: MarkdownRouter): void {
    router = markdownRouter;
}

export function renderMarkdown(markdown: string): string {
    let html = marked(markdown, { renderer: makeRenderer(), async: false });

    html = safeHtml(html);
    html = renderActionLinks(html);
    html = renderRouteLinks(html);

    return html;
}

export function renderMarkdownAsText(markdown: string): string {
    return renderBlockTokensAsText(marked.lexer(markdown)).trim();
}

export function safeHtml(html: string): string {
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}

import DOMPurify from 'dompurify';
import { stringMatchAll, tap } from '@noeldemartin/utils';
import { Renderer, marked } from 'marked';

let router: MarkdownRouter | null = null;

function makeRenderer(): Renderer {
    return tap(new Renderer(), (renderer) => {
        renderer.link = function(link) {
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

export function safeHtml(html: string): string {
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}

import imageSize from 'image-size';
import { readFileSync } from 'node:fs';

import { ICONS } from '@aerogel/vite/lib/icons';
import type { AppInfo } from '@aerogel/vite/lib/options';

function imageMeta(path: string): string {
    const image = readFileSync(path);
    const size = imageSize(image);

    return `
        <meta property="og:image" content="${path}" />
        <meta property="og:image:width" content="${size.width}" />
        <meta property="og:image:height" content="${size.height}" />
    `;
}

export interface HTMLEvalScope {
    app: AppInfo;
    readFile(path: string): string;
}

export function css(this: HTMLEvalScope, path: string): string {
    return `<style>${this.readFile(path)}</style>`;
}

export function favicons(this: HTMLEvalScope): string {
    return `
        <link rel="apple-touch-icon" sizes="180x180" href="${this.app.basePath}${ICONS.appleTouch.fileName}" />
        <link rel="icon" type="image/png" sizes="96x96" href="${this.app.basePath}${ICONS.faviconPNG.fileName}"  />
        <link rel="icon" type="image/svg+xml" sizes="any" href="${this.app.basePath}${ICONS.faviconSVG.fileName}" />
        <link rel="shortcut icon" href="${this.app.basePath}${ICONS.favicon.fileName}" />
    `;
}

export function js(this: HTMLEvalScope, path: string): string {
    return `<script>${this.readFile(path)}</script>`;
}

export function socialMeta(this: HTMLEvalScope, options: { image?: string } = {}): string {
    const urlMeta = this.app.baseUrl && `<meta property="og:url" content="${this.app.baseUrl}" />`;
    const descriptionMeta =
        this.app.description &&
        `
            <meta property="og:description" content="${this.app.description}" />
            <meta name="description" content="${this.app.description}" />
        `;

    return `
        <meta name="apple-mobile-web-app-title" content="${this.app.name}" />
        <meta name="application-name" content="${this.app.name}" />
        <meta name="msapplication-TileColor" content="${this.app.themeColor}" />
        <meta name="theme-color" content="${this.app.themeColor}" />
        <meta property="og:title" content="${this.app.name}" />
        <meta property="og:type" content="website" />
        ${urlMeta ?? ''}
        ${descriptionMeta ?? ''}
        ${options.image ? imageMeta(options.image) : ''}
    `;
}

export function originTrials(): string {
    const values = process.env.ORIGIN_TRIALS && String(process.env.ORIGIN_TRIALS).trim();

    if (!values) {
        return '';
    }

    return values
        .split(',')
        .map((value) => `<meta http-equiv="origin-trial" content="${value}">`)
        .join('\n');
}

export function splashJs(): string {
    return `
        <script>
            setTimeout(function() {
                if (!document.querySelector('#app.loading')) {
                    return;
                }

                document.getElementById('splash').style.opacity = 1;
            }, 1000);
        </script>
    `;
}

export function svg(this: HTMLEvalScope, path: string): string {
    return this.readFile(path);
}

import type { AppInfo } from '@aerogel/vite/lib/options';

export interface HTMLEvalScope {
    app: AppInfo;
    readFile(path: string): string;
}

export function css(this: HTMLEvalScope, path: string): string {
    return `<style>${this.readFile(path)}</style>`;
}

export function favicons(this: HTMLEvalScope, options: { maskIconColor?: string } = {}): string {
    const maskIconColor = options.maskIconColor ?? this.app.themeColor;

    return `
        <link rel="apple-touch-icon" sizes="180x180" href="${this.app.basePath}apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="${this.app.basePath}favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="${this.app.basePath}favicon-16x16.png" />
        <link rel="mask-icon" href="${this.app.basePath}safari-pinned-tab.svg" color="${maskIconColor}" />
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
    const imageMeta =
        options.image &&
        `
            <meta property="og:image" content="${options.image}" />

            <!-- TODO calculate real image dimensions (these are hard-coded) -->
            <meta property="og:image:width" content="600" />
            <meta property="og:image:height" content="250" />
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
        ${imageMeta ?? ''}
    `;
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

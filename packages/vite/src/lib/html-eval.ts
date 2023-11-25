export interface HTMLEvalScope {
    readFile(path: string): string;
}

export function css(this: HTMLEvalScope, path: string): string {
    return `<style>${this.readFile(path)}</style>`;
}

export function js(this: HTMLEvalScope, path: string): string {
    return `<script>${this.readFile(path)}</script>`;
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

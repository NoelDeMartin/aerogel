import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { stringMatchAll, toString } from '@noeldemartin/utils';

import * as globalScope from './html-eval';
import type { HTMLEvalScope } from './html-eval';

function evalScript(script: string, scope: HTMLEvalScope): unknown {
    return Function(`with (this) { return ${script} }`).bind({
        ...globalScope,
        ...scope,
    })();
}

export function renderHTML(html: string, filename: string, scope: Record<string, unknown> = {}): string {
    const matches = stringMatchAll<2>(html, /{{(.*?)}}/g);
    const directory = dirname(filename);
    const readFile = (path: string) => readFileSync(resolve(directory, path)).toString();

    for (const match of matches) {
        html = html.replace(
            match[0],
            toString(
                evalScript(match[1], {
                    ...scope,
                    readFile,
                }),
            ),
        );
    }

    return html;
}

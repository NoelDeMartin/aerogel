import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { AppInfo } from '@aerogel/vite/lib/options';
import { stringMatchAll, toString } from '@noeldemartin/utils';

import * as globalScope from './html-eval';
import type { HTMLEvalScope } from './html-eval';

function evalScript(script: string, scope: HTMLEvalScope): unknown {
    // oxlint-disable-next-line typescript/no-implied-eval
    return Function(`with (this) { return ${script} }`).bind({
        ...globalScope,
        ...scope,
    })();
}

export function renderHTML(html: string, filename: string, app: AppInfo): string {
    const matches = stringMatchAll<2>(html, /{{(.*?)}}/g);
    const directory = dirname(filename);
    const readFile = (path: string) => readFileSync(resolve(directory, path)).toString();

    for (const match of matches) {
        html = html.replace(
            match[0],
            toString(
                evalScript(match[1], {
                    app,
                    readFile,
                }),
            ),
        );
    }

    return html;
}

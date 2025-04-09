import { existsSync, readFileSync } from 'node:fs';

import type { AppInfo } from '@aerogel/vite/lib/options';

export function loadLocales(app: AppInfo, localesJsonPath: string): void {
    if (!existsSync(localesJsonPath)) {
        return;
    }

    app.locales = JSON.parse(readFileSync(localesJsonPath).toString()) as Record<string, string>;
}

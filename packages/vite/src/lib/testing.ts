import type { AppInfo } from '@aerogel/vite/lib/options';
import { arrayFilter } from '@noeldemartin/utils';

export function generateSetupVitestVirtualModule(app: AppInfo): string {
    return arrayFilter([
        "import '@aerogel/core/setup-vitest';",
        app.plugins?.includes('solid') && "import '@aerogel/plugin-solid/setup-vitest';",
    ]).join('\n');
}

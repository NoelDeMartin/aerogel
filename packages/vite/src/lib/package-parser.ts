import { existsSync, readFileSync } from 'fs';
import { objectWithoutEmpty } from '@noeldemartin/utils';

import type { AppInfo } from '@/lib/options';

interface PackageJson {
    repository?: string | { type: string; url: string };
    dependencies?: Record<string, string>;
}

function getSourceUrl(packageJson: PackageJson): string | null {
    if (!packageJson.repository) {
        return null;
    }

    if (typeof packageJson.repository === 'object') {
        return packageJson.repository.url.replace(`.${packageJson.repository.type}`, '');
    }

    return packageJson.repository?.replace('github:', 'https://github.com/');
}

function getPlugins(packageJson: PackageJson): string[] {
    return Object.keys(packageJson.dependencies ?? {})
        .filter((dependency) => dependency.startsWith('@aerogel/plugin-'))
        .map((plugin) => plugin.substring(16));
}

export function loadPackageInfo(app: AppInfo, packageJsonPath: string): void {
    if (!existsSync(packageJsonPath)) {
        return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath).toString()) as PackageJson;
    const parsed: Partial<AppInfo> = objectWithoutEmpty({
        sourceUrl: getSourceUrl(packageJson),
        plugins: getPlugins(packageJson),
    });

    Object.assign(app, parsed);
}

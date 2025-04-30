import { arraySorted } from '@noeldemartin/utils';

import File from '@aerogel/cli/lib/File';

export function addNpmDependency(name: string, version: string, development: boolean = false): void {
    const packageJson = (JSON.parse(File.read('package.json') ?? '{}') ?? {}) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };
    const dependencies = (development ? packageJson?.devDependencies : packageJson?.dependencies) ?? {};
    const dependencyNames = arraySorted(Object.keys(dependencies).concat(name));
    const index = dependencyNames.indexOf(name);
    const previousDependency = dependencyNames[index - 1] ?? '';

    File.replace(
        'package.json',
        `"${previousDependency}": "${dependencies[previousDependency]}",`,
        `
            "${previousDependency}": "${dependencies[previousDependency]}",
            "${name}": "${version}",
        `,
    );
}

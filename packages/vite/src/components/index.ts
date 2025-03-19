import type { ComponentResolveResult } from 'unplugin-vue-components';

const components = {
    '@aerogel/core': ['Modal', 'Button', 'Progress', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger'],
    '@aerogel/plugin-offline-first': ['Account'],
    '@aerogel/plugin-solid': ['SolidAvatar'],
};

// TODO form

const componentsIndex = Object.entries(components).reduce((index, [plugin, names]) => {
    for (const name of names) {
        index[name] = plugin;
    }

    return index;
}, {} as Record<string, string>);

export function resolveComponent(name: string): ComponentResolveResult {
    const plugin = componentsIndex[name];

    if (plugin) {
        return { name, as: name, from: plugin };
    }

    if (name === 'Form') {
        // TODO configure alias instead
        return { name: 'AGForm', as: name, from: '@aerogel/core' };
    }

    if (!name.startsWith('AG') || name.startsWith('AGStory')) {
        return;
    }

    if (name.startsWith('AGSolid')) {
        return { name, as: name, from: '@aerogel/plugin-solid' };
    }

    if (name.startsWith('AGCloud')) {
        return { name, as: name, from: '@aerogel/plugin-offline-first' };
    }

    return { name, as: name, from: '@aerogel/core' };
}

import type { ComponentResolver } from 'unplugin-vue-components';

const coreComponents = Object.keys(
    import.meta.glob('../../../core/src/components/**/*.vue', {
        eager: true,
        query: '?ignore',
    }),
).map((filename) => filename.split('/').pop()?.replace('.vue', '') ?? '');

const solidComponents = Object.keys(
    import.meta.glob('../../../plugin-solid/src/components/**/*.vue', {
        eager: true,
        query: '?ignore',
    }),
).map((filename) => filename.split('/').pop()?.replace('.vue', '') ?? '');

const localFirstComponents = Object.keys(
    import.meta.glob('../../../plugin-local-first/src/components/**/*.vue', {
        eager: true,
        query: '?ignore',
    }),
).map((filename) => filename.split('/').pop()?.replace('.vue', '') ?? '');

export default function AerogelResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name) => {
            if (coreComponents.includes(name)) {
                return { name, as: name, from: '@aerogel/core' };
            }

            if (solidComponents.includes(name)) {
                return { name, as: name, from: '@aerogel/plugin-solid' };
            }

            if (localFirstComponents.includes(name)) {
                return { name, as: name, from: '@aerogel/plugin-local-first' };
            }
        },
    };
}

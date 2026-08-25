declare module '*.vue' {
    import type { DefineComponent } from 'vue';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component: DefineComponent<Record<string, unknown>, {}, any>;

    export default component;
}

declare module '*.jsonld' {
    const content: unknown;

    export default content;
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue';

    // oxlint-disable-next-line typescript/no-explicit-any
    const component: DefineComponent<Record<string, unknown>, {}, any>;

    export default component;
}

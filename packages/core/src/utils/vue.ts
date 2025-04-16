import { fail, toString } from '@noeldemartin/utils';
import { Comment, Static, Text, inject, reactive } from 'vue';
import type { Directive, InjectionKey, MaybeRef, Ref, UnwrapNestedRefs, VNode } from 'vue';

export type AcceptRefs<T> = { [K in keyof T]: T[K] | RefUnion<T[K]> };
export type RefUnion<T> = T extends infer R ? Ref<R> : never;
export type Unref<T> = { [K in keyof T]: T[K] extends MaybeRef<infer Value> ? Value : T[K] };

function renderVNodeAttrs(node: VNode): string {
    return Object.entries(node.props ?? {}).reduce((attrs, [name, value]) => {
        return attrs + `${name}="${toString(value)}"`;
    }, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineDirective<TValue = any, TModifiers extends string = string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    directive: Directive<any, TValue, TModifiers>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Directive<any, TValue, TModifiers> {
    return directive;
}

export function injectReactive<T extends object>(key: InjectionKey<T> | string): UnwrapNestedRefs<T> | undefined {
    const value = inject(key);

    return value ? reactive<T>(value) : undefined;
}

export function injectReactiveOrFail<T extends object>(
    key: InjectionKey<T> | string,
    errorMessage?: string,
): UnwrapNestedRefs<T> {
    return injectReactive(key) ?? fail(errorMessage ?? `Could not resolve '${toString(key)}' injection key`);
}

export function injectOrFail<T>(key: InjectionKey<T> | string, errorMessage?: string): T {
    return inject(key) ?? fail(errorMessage ?? `Could not resolve '${toString(key)}' injection key`);
}

export function renderVNode(node: VNode | string): string {
    if (typeof node === 'string') {
        return node;
    }

    if (node.type === Comment) {
        return '';
    }

    if (node.type === Text || node.type === Static) {
        return node.children as string;
    }

    if (node.type === 'br') {
        return '\n\n';
    }

    return `<${node.type} ${renderVNodeAttrs(node)}>${Array.from(node.children as Array<VNode | string>)
        .map(renderVNode)
        .join('')}</${node.type}>`;
}

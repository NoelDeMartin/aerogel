import { inject, onUnmounted } from 'vue';

import type FormController from '@aerogel/core/forms/FormController';

export function onFormFocus(input: { name: string | null }, listener: () => unknown): void {
    const form = inject<FormController | null>('form', null);
    const stop = form?.on('focus', (name) => input.name === name && listener());

    onUnmounted(() => stop?.());
}

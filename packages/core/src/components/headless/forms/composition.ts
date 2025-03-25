import { inject, onUnmounted } from 'vue';

import type Form from '@aerogel/core/forms/Form';

export function onFormFocus(input: { name: string | null }, listener: () => unknown): void {
    const form = inject<Form | null>('form', null);
    const stop = form?.on('focus', (name) => input.name === name && listener());

    onUnmounted(() => stop?.());
}

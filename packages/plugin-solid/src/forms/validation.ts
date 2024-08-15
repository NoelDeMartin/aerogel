import { defineFormValidationRule } from '@aerogel/core';

export function defineFormValidationRules(): void {
    defineFormValidationRule<string>('container_url', (value) => {
        if (value.endsWith('/')) {
            return;
        }

        return 'containerEndingSlashMissing';
    });
}

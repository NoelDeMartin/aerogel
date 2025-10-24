import { registerFormValidationRule } from '@aerogel/core';

export function registerFormValidationRules(): void {
    registerFormValidationRule<string>('container_url', (value) => {
        if (value.endsWith('/')) {
            return;
        }

        return 'containerEndingSlashMissing';
    });
}

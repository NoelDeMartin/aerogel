import { registerFormValidationRule } from '@aerogel/core/forms/validation';
import { definePlugin } from '@aerogel/core/plugins';

export * from './FormController';
export * from './utils';
export * from './validation';
export { default as FormController } from './FormController';

export default definePlugin({
    async install(_, { formValidationRules }) {
        for (const [rule, validator] of Object.entries(formValidationRules ?? {})) {
            registerFormValidationRule(rule, validator);
        }
    },
});

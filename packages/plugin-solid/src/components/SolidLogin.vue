<template>
    <Form :form :class="renderedClasses" @submit="submit">
        <div
            class="flex flex-col items-center gap-2"
            :class="{ 'md:flex-row': layout === 'horizontal' && !form.authenticator }"
        >
            <Input
                v-if="showInput"
                name="url"
                :aria-label="$td('solid.logIn.label', 'Login url')"
                :placeholder="$td('solid.logIn.placeholder', 'https://me.solidcommunity.net')"
                class="w-full md:w-96"
            />
            <Select
                v-if="form.authenticator"
                name="authenticator"
                class="w-96 max-w-full"
                label-class="sr-only"
                options-class="w-96 max-w-[calc(100vw-4rem)]"
                :label="$td('solid.logIn.switchAuthenticatorLabel', 'Authentication method')"
                :options="authenticatorOptions"
                :render-option="renderAuthenticator"
            />
            <div v-if="showDevLogin && !usingManualUrl" class="flex w-full justify-center gap-2 md:w-auto">
                <Button
                    variant="secondary"
                    class="group gap-0"
                    :title="$td('solid.logIn.manualUrl', 'Enter url')"
                    @click="usingManualUrl = true"
                >
                    <IconLogin class="size-4" />
                    <span
                        v-measure.css="() => (measured = true)"
                        class="overflow-hidden pl-1 whitespace-nowrap"
                        :class="{
                            'opacity-0': !measured,
                            'w-0 transition-[width] md:group-hover:w-(--width)': measured,
                        }"
                    >{{ $td('solid.logIn.manualUrl', 'Enter url') }}</span>
                </Button>
                <Button
                    :disabled="noLoading && $solid.loginOngoing"
                    submit
                    class="whitespace-nowrap"
                    @click="form.url = 'dev'"
                >
                    {{ $td('solid.logIn.dev', 'Log in to dev server') }}
                </Button>
            </div>
            <Button
                v-else
                :disabled="noLoading && $solid.loginOngoing"
                submit
                :class="renderedButtonClasses"
            >
                {{ $td('solid.logIn.submit', 'Log in') }}
            </Button>
        </div>
        <Link
            v-if="allowLegacyAuthenticator && showInput && !form.authenticator"
            class="text-sm font-normal text-gray-700"
            @click="form.authenticator = 'inrupt'"
        >
            {{ $td('solid.logIn.switchAuthenticator', "Can't log in? Try using a different authentication method") }}
        </Link>
    </Form>
</template>

<script setup lang="ts">
import IconLogin from '~icons/ic/baseline-log-in';

import {
    App,
    Button,
    Form,
    Input,
    Link,
    Select,
    UI,
    classes,
    requiredStringInput,
    stringInput,
    translateWithDefault,
    useForm,
} from '@aerogel/core';
import { computed, ref } from 'vue';
import type { HTMLAttributes } from 'vue';

import Solid from '@aerogel/plugin-solid/services/Solid';
import type { AuthenticatorName } from '@aerogel/plugin-solid/auth';

const AUTHENTICATOR_LABELS = {
    inrupt: 'Log in using Inrupt\'s authentication library',
    legacy: 'Log in using the legacy authentication library',
} satisfies Partial<Record<AuthenticatorName, string>>;

const {
    class: rootClasses = '',
    layout = 'horizontal',
    buttonClass,
    noLoading,
    allowLegacyAuthenticator,
} = defineProps<{
    class?: HTMLAttributes['class'];
    buttonClass?: HTMLAttributes['class'];
    layout?: 'vertical' | 'horizontal';
    noLoading?: boolean;
    allowLegacyAuthenticator?: boolean;
}>();
const form = useForm({
    url: requiredStringInput(),
    authenticator: stringInput(),
});
const authenticatorOptions = Object.keys(AUTHENTICATOR_LABELS) as (keyof typeof AUTHENTICATOR_LABELS)[];
const measured = ref(false);
const usingManualUrl = ref(false);
const showInput = computed(() => !showDevLogin.value || usingManualUrl.value);
const showDevLogin = computed(
    () => App.development && (!form.url || form.url === 'dev' || form.url.trim().length === 0),
);
const renderedClasses = computed(() => classes('flex flex-col items-center gap-2 w-full md:w-auto', rootClasses));
const renderedButtonClasses = computed(() =>
    classes('w-full whitespace-nowrap', { 'md:w-auto': layout === 'horizontal' && !form.authenticator }, buttonClass));

function renderAuthenticator(option: keyof typeof AUTHENTICATOR_LABELS) {
    return translateWithDefault(
        `solid.logIn.switchAuthenticator${option.charAt(0).toUpperCase() + option.slice(1)}`,
        AUTHENTICATOR_LABELS[option],
    );
}

async function submit() {
    if (noLoading) {
        await Solid.login(form.url, { authenticator: form.authenticator as AuthenticatorName });

        return;
    }

    await UI.loading(translateWithDefault('solid.loginOngoing', 'Logging in...'), Solid.login(form.url));
}
</script>

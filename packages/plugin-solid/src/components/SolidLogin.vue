<template>
    <Form :form :class="renderedClasses" @submit="submit">
        <Input
            v-if="showInput"
            name="url"
            :aria-label="$td('solid.logIn.label', 'Login url')"
            :placeholder="$td('solid.logIn.placeholder', 'https://me.solidcommunity.net')"
            class="w-full md:w-96"
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
    </Form>
</template>

<script setup lang="ts">
import IconLogin from '~icons/ic/baseline-log-in';

import {
    App,
    Button,
    Form,
    Input,
    UI,
    classes,
    requiredStringInput,
    translateWithDefault,
    useForm,
} from '@aerogel/core';
import { computed, ref } from 'vue';
import type { HTMLAttributes } from 'vue';

import Solid from '@aerogel/plugin-solid/services/Solid';

const {
    class: rootClasses = '',
    buttonClass,
    noLoading,
} = defineProps<{ class?: HTMLAttributes['class']; buttonClass?: HTMLAttributes['class']; noLoading?: boolean }>();
const form = useForm({ url: requiredStringInput() });
const measured = ref(false);
const usingManualUrl = ref(false);
const showInput = computed(() => !showDevLogin.value || usingManualUrl.value);
const showDevLogin = computed(
    () => App.development && (!form.url || form.url === 'dev' || form.url.trim().length === 0),
);
const renderedClasses = computed(() =>
    classes('flex flex-col items-center gap-2 w-full md:w-auto md:flex-row', rootClasses));
const renderedButtonClasses = computed(() => classes('w-full whitespace-nowrap md:w-auto', buttonClass));

async function submit() {
    if (noLoading) {
        await Solid.login(form.url);

        return;
    }

    await UI.loading(translateWithDefault('solid.loginOngoing', 'Logging in...'), Solid.login(form.url));
}
</script>

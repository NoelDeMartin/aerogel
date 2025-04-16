<template>
    <Form :form class="flex flex-col items-center gap-2 md:flex-row" @submit="submit">
        <Input
            v-if="showInput"
            name="url"
            :aria-label="$td('solid.logIn.label', 'Login url')"
            :placeholder="$td('solid.logIn.placeholder', 'https://me.solidcommunity.net')"
            class="w-96 max-w-full"
        />
        <template v-if="showDevLogin">
            <Button
                v-if="!usingManualUrl"
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
                        'w-0 transition-[width] group-hover:w-(--width)': measured,
                    }"
                >{{ $td('solid.logIn.manualUrl', 'Enter url') }}</span>
            </Button>
            <Button
                :disabled="noLoading && $solid.loginOngoing"
                submit
                class="w-full whitespace-nowrap md:w-auto"
                @click="form.url = 'dev'"
            >
                {{ $td('solid.logIn.dev', 'Log in to dev server') }}
            </Button>
        </template>
        <Button
            v-else
            :disabled="noLoading && $solid.loginOngoing"
            submit
            class="w-full md:w-auto"
        >
            {{ $td('solid.logIn.submit', 'Log in') }}
        </Button>
    </Form>
</template>

<script setup lang="ts">
import IconLogin from '~icons/ic/baseline-log-in';

import { App, Button, Form, Input, UI, requiredStringInput, translateWithDefault, useForm } from '@aerogel/core';
import { computed, ref } from 'vue';

import Solid from '@aerogel/plugin-solid/services/Solid';

const { noLoading } = defineProps<{ noLoading?: boolean }>();
const form = useForm({ url: requiredStringInput() });
const measured = ref(false);
const usingManualUrl = ref(false);
const showInput = computed(() => !showDevLogin.value || usingManualUrl.value);
const showDevLogin = computed(
    () => App.development && (!form.url || form.url === 'dev' || form.url.trim().length === 0),
);

async function submit() {
    if (noLoading) {
        await Solid.login(form.url);

        return;
    }

    await UI.loading(translateWithDefault('solid.loginOngoing', 'Logging in...'), Solid.login(form.url));
}
</script>

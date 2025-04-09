<template>
    <Modal :title="$td('settings.title', 'Settings')">
        <Select
            v-model="$lang.locale"
            class="flex flex-col items-start md:flex-row"
            as="div"
            :options
            :render-option="renderLocale"
        >
            <div class="grow">
                <SelectLabel>
                    {{ $td('settings.locale', 'Language') }}
                </SelectLabel>
                <Markdown
                    lang-key="settings.localeDescription"
                    lang-default="Choose the application's language."
                    class="mt-1 text-sm text-gray-500"
                />
            </div>
            <Button variant="ghost" :as="SelectTrigger" class="w-auto outline-none" />
            <SelectOptions />
        </Select>
    </Modal>
</template>

<script setup lang="ts">
import Aerogel from 'virtual:aerogel';

import { computed } from 'vue';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import Select from '@aerogel/core/components/ui/Select.vue';
import SelectLabel from '@aerogel/core/components/ui/SelectLabel.vue';
import SelectTrigger from '@aerogel/core/components/ui/SelectTrigger.vue';
import SelectOptions from '@aerogel/core/components/ui/SelectOptions.vue';
import { Lang, translateWithDefault } from '@aerogel/core/lang';

const browserLocale = Lang.getBrowserLocale();
const options = computed(() => [null, ...Lang.locales]);

function renderLocale(locale: string | null): string {
    return (
        (locale && Aerogel.locales[locale]) ??
        translateWithDefault('settings.localeDefault', '{locale} (default)', {
            locale: Aerogel.locales[browserLocale] ?? browserLocale,
        })
    );
}
</script>

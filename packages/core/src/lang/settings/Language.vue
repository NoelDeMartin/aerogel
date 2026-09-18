<template>
    <Select
        v-model="$lang.selectedLocale"
        class="flex flex-col items-start md:flex-row"
        as="div"
        :options
        :render-option="renderLocale"
    >
        <div class="grow">
            <SelectLabel class="text-base font-semibold">
                {{ $td('settings.locale', 'Language') }}
            </SelectLabel>
            <Markdown
                lang-key="settings.localeDescription"
                lang-default="Choose the application's language."
                class="mt-1 text-sm text-gray-500"
            />
        </div>
        <Button variant="ghost" :as="SelectTrigger" class="grid w-auto outline-none" />
        <SelectOptions />
    </Select>
</template>

<script setup lang="ts">
import Aerogel from 'virtual:aerogel';

import { computed } from 'vue';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import Select from '@aerogel/core/components/ui/Select.vue';
import SelectLabel from '@aerogel/core/components/ui/SelectLabel.vue';
import SelectTrigger from '@aerogel/core/components/ui/SelectTrigger.vue';
import SelectOptions from '@aerogel/core/components/ui/SelectOptions.vue';
import { Lang, SYSTEM_LOCALE, getBrowserLocale, translateWithDefault } from '@aerogel/core/lang';

const browserLocale = computed(() => getBrowserLocale(Lang.locales) ?? Lang.fallbackLocale);
const options = computed(() => [SYSTEM_LOCALE, ...Lang.locales]);

function renderLocale(locale: string): string {
    if (locale === SYSTEM_LOCALE) {
        return translateWithDefault('settings.localeSystem', 'System ({locale})', {
            locale: Aerogel.locales[browserLocale.value] ?? browserLocale.value,
        });
    }

    return Aerogel.locales[locale] ?? locale;
}
</script>

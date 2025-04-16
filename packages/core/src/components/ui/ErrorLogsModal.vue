<template>
    <Modal :title="$td('errors.logs', 'Error logs')">
        <ol>
            <li
                v-for="(log, index) of $errors.logs"
                :key="index"
                class="mb-2 flex max-w-prose min-w-56 justify-between py-2 last:mb-0"
            >
                <div>
                    <h3 class="font-medium">
                        {{ log.report.title }}
                    </h3>
                    <time :datetime="log.date.toISOString()" class="text-xs text-gray-700">
                        {{ log.date.toLocaleTimeString() }}
                    </time>
                    <Markdown
                        class="text-sm text-gray-500"
                        :text="log.report.description ?? getErrorMessage(log.report)"
                    />
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    :aria-label="$td('errors.viewDetails', 'View details')"
                    :title="$td('errors.viewDetails', 'View details')"
                    class="self-center"
                    @click="
                        $errors.inspect(
                            log.report,
                            $errors.logs.map(({ report }) => report)
                        )
                    "
                >
                    <IconViewShow class="size-4" aria-hidden="true" />
                </Button>
            </li>
        </ol>
    </Modal>
</template>

<script setup lang="ts">
import IconViewShow from '~icons/zondicons/view-show';

import Button from '@aerogel/core/components/ui/Button.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import { getErrorMessage } from '@aerogel/core/errors';
</script>

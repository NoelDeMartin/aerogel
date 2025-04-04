<template>
    <div class="flex">
        <slot v-for="button of buttons" v-bind="button">
            <Button
                size="icon"
                variant="ghost"
                class="group whitespace-nowrap"
                :href="button.url"
                :title="$td(`errors.report_${button.id}`, button.description)"
                @click="button.handler"
            >
                <span class="sr-only">{{ $td(`errors.report_${button.id}`, button.description) }}</span>
                <component :is="button.iconComponent" class="size-4" aria-hidden="true" />
            </Button>
        </slot>
    </div>
</template>

<script setup lang="ts">
import IconConsole from '~icons/mdi/console';
import IconCopy from '~icons/zondicons/copy';
import IconGitHub from '~icons/mdi/github';

import { computed } from 'vue';
import { stringExcerpt, tap } from '@noeldemartin/utils';
import type { Component } from 'vue';

import App from '@aerogel/core/services/App';
import Button from '@aerogel/core/components/ui/Button.vue';
import UI from '@aerogel/core/ui/UI';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import type { ErrorReport } from '@aerogel/core/errors';

interface ErrorReportModalButtonsDefaultSlotProps {
    id: string;
    description: string;
    iconComponent: Component;
    url?: string;
    handler?(): void;
}

defineSlots<{
    default(props: ErrorReportModalButtonsDefaultSlotProps): unknown;
}>();

const props = defineProps<{ report: ErrorReport }>();
const summary = computed(() =>
    props.report.description ? `${props.report.title}: ${props.report.description}` : props.report.title);
const githubReportUrl = computed(() => {
    if (!App.sourceUrl) {
        return false;
    }

    const issueTitle = encodeURIComponent(summary.value);
    const issueBody = encodeURIComponent(
        [
            '[Please, explain here what you were trying to do when this error appeared]',
            '',
            'Error details:',
            '```',
            stringExcerpt(
                props.report.details ?? 'Details missing from report',
                1800 - issueTitle.length - App.sourceUrl.length,
            ).trim(),
            '```',
        ].join('\n'),
    );

    return `${App.sourceUrl}/issues/new?title=${issueTitle}&body=${issueBody}`;
});
const buttons = computed(() =>
    tap(
        [
            {
                id: 'clipboard',
                description: 'Copy to clipboard',
                iconComponent: IconCopy,
                async handler() {
                    await navigator.clipboard.writeText(`${summary.value}\n\n${props.report.details}`);

                    UI.showSnackbar(
                        translateWithDefault('errors.copiedToClipboard', 'Debug information copied to clipboard'),
                    );
                },
            },
            {
                id: 'console',
                description: 'Log to console',
                iconComponent: IconConsole,
                handler() {
                    const error = props.report.error ?? props.report;

                    (window as { error?: unknown }).error = error;

                    // eslint-disable-next-line no-console
                    console.error(error);

                    UI.showSnackbar(
                        translateWithDefault(
                            'errors.addedToConsole',
                            'You can now use the **error** variable in the console',
                        ),
                    );
                },
            },
        ] as ErrorReportModalButtonsDefaultSlotProps[],
        (reportButtons) => {
            if (!githubReportUrl.value) {
                return;
            }

            reportButtons.push({
                id: 'github',
                description: 'Report in GitHub',
                iconComponent: IconGitHub,
                url: githubReportUrl.value,
            });
        },
    ));
</script>

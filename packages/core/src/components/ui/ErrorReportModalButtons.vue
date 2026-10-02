<template>
    <div class="flex">
        <slot v-for="button of buttons" v-bind="button">
            <Button
                variant="ghost"
                class="group cursor-pointer whitespace-nowrap"
                :href="button.url"
                :title="$td(`errors.report_${button.id}`, button.description)"
                @click="button.click"
            >
                <span class="sr-only">{{ $td(`errors.report_${button.id}`, button.description) }}</span>
                <component :is="button.iconComponent" :class="classes('size-5', button.iconClass)" aria-hidden="true" />
            </Button>
        </slot>
    </div>
</template>

<script setup lang="ts">
import Button from '@aerogel/core/components/ui/Button.vue';
import { Errors, type ErrorReport } from '@aerogel/core/errors';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import App from '@aerogel/core/services/App';
import UI from '@aerogel/core/ui/UI';
import { classes } from '@aerogel/core/utils/classes';
import { stringExcerpt, tap } from '@noeldemartin/utils';
import { computed } from 'vue';
import type { Component } from 'vue';
import IconConsole from '~icons/mdi/console';
import IconGitHub from '~icons/mdi/github';
import IconCause from '~icons/uil/top-arrow-from-top';
import IconCopy from '~icons/zondicons/copy';

interface ErrorReportModalButtonsDefaultSlotProps {
    id: string;
    description: string;
    iconComponent: Component;
    iconClass?: string;
    url?: string;
    click?(): void;
}

defineSlots<{
    default(props: ErrorReportModalButtonsDefaultSlotProps): unknown;
}>();

const { report } = defineProps<{ report: ErrorReport }>();
const summary = computed(() => (report.description ? `${report.title}: ${report.description}` : report.title));
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
                report.details ?? 'Details missing from report',
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
                description: translateWithDefault('errors.copyToClipboard', 'Copy to clipboard'),
                iconComponent: IconCopy,
                iconClass: 'w-6! h-5!',
                async click() {
                    await navigator.clipboard.writeText(`${summary.value}\n\n${report.details}`);

                    UI.toast(translateWithDefault('errors.copiedToClipboard', 'Debug information copied to clipboard'));
                },
            },
            {
                id: 'console',
                description: translateWithDefault('errors.logToConsole', 'Log to console'),
                iconComponent: IconConsole,
                click() {
                    const error = report.error ?? report;

                    (window as { error?: unknown }).error = error;

                    // oxlint-disable-next-line no-console
                    console.error(error);

                    UI.toast(
                        translateWithDefault(
                            'errors.addedToConsole',
                            'You can now use the **error** variable in the console',
                        ),
                    );
                },
            },
        ] as ErrorReportModalButtonsDefaultSlotProps[],
        (reportButtons) => {
            if (report.error instanceof Error && report.error.cause) {
                const cause = report.error.cause;

                reportButtons.unshift({
                    id: 'cause',
                    description: translateWithDefault('errors.cause', 'View cause'),
                    iconComponent: IconCause,
                    click: () => Errors.inspect(cause),
                });
            }

            if (githubReportUrl.value) {
                reportButtons.push({
                    id: 'github',
                    description: translateWithDefault('errors.reportInGitHub', 'Report in GitHub'),
                    iconComponent: IconGitHub,
                    url: githubReportUrl.value,
                });
            }
        },
    ),
);
</script>

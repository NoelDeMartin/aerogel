<template>
    <div class="flex">
        <slot v-for="(button, i) of buttons" v-bind="(button as unknown as ComponentProps)" :key="i">
            <AGButton
                :url="button.url"
                clear
                :title="$td(`errors.report_${button.id}`, button.description)"
                :aria-label="$td(`errors.report_${button.id}`, button.description)"
                @click="button.handler"
            >
                <component :is="button.icon" class="h-4 w-4" aria-hidden="true" />
            </AGButton>
        </slot>
    </div>
</template>

<script setup lang="ts">
import IconConsole from '~icons/mdi/console';
import IconCopy from '~icons/zondicons/copy';
import IconGitHub from '~icons/mdi/github';

import { computed } from 'vue';
import { stringExcerpt, tap } from '@noeldemartin/utils';

import App from '@/services/App';
import UI from '@/ui/UI';
import { requiredObjectProp } from '@/utils/vue';
import { translateWithDefault } from '@/lang/utils';
import type { ComponentProps } from '@/utils/vue';
import type { ErrorReport } from '@/errors';

import AGButton from '../forms/AGButton.vue';
import type { IAGErrorReportModalButtonsDefaultSlotProps } from './AGErrorReportModal';

const props = defineProps({
    report: requiredObjectProp<ErrorReport>(),
});
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
                icon: IconCopy,
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
                icon: IconConsole,
                handler() {
                    (window as { error?: unknown }).error = props.report.error;

                    UI.showSnackbar(
                        translateWithDefault(
                            'errors.addedToConsole',
                            'You can now use the **error** variable in the console',
                        ),
                    );
                },
            },
        ],
        (reportButtons: IAGErrorReportModalButtonsDefaultSlotProps[]) => {
            if (!githubReportUrl.value) {
                return;
            }

            reportButtons.push({
                id: 'github',
                description: 'Report in GitHub',
                icon: IconGitHub,
                url: githubReportUrl.value,
            });
        },
    ));
</script>

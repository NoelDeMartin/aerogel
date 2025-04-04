import { computed, ref } from 'vue';

import { translateWithDefault } from '@aerogel/core/lang';
import type { ErrorReport } from '@aerogel/core/errors';

export interface ErrorReportModalProps {
    reports: ErrorReport[];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useErrorReportModal(props: ErrorReportModalProps) {
    const activeReportIndex = ref(0);
    const report = computed(() => props.reports[activeReportIndex.value] as ErrorReport);
    const details = computed(
        () =>
            report.value.details?.trim() ||
            translateWithDefault('errors.detailsEmpty', 'This error is missing a stacktrace.'),
    );
    const previousReportText = translateWithDefault('errors.previousReport', 'Show previous report');
    const nextReportText = translateWithDefault('errors.nextReport', 'Show next report');

    return {
        activeReportIndex,
        details,
        nextReportText,
        previousReportText,
        report,
    };
}

import { computed, ref } from 'vue';

import { translateWithDefault } from '@aerogel/core/lang';
import type { ErrorReport } from '@aerogel/core/errors';
import type { ModalExpose } from '@aerogel/core/components/contracts/Modal';

export interface ErrorReportModalProps {
    report: ErrorReport;
    reports: ErrorReport[];
}

export interface ErrorReportModalExpose extends ModalExpose {}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useErrorReportModal(props: ErrorReportModalProps) {
    const activeReportIndex = ref(props.reports.includes(props.report) ? props.reports.indexOf(props.report) : 0);
    const activeReport = computed(() => props.reports[activeReportIndex.value] as ErrorReport);
    const details = computed(
        () =>
            activeReport.value.details?.trim() ||
            translateWithDefault('errors.detailsEmpty', 'This error is missing a stacktrace.'),
    );
    const previousReportText = translateWithDefault('errors.previousReport', 'Show previous report');
    const nextReportText = translateWithDefault('errors.nextReport', 'Show next report');

    return {
        activeReportIndex,
        details,
        nextReportText,
        previousReportText,
        activeReport,
    };
}

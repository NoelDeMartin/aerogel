import { computed, ref } from 'vue';
import type { Component, ExtractPropTypes } from 'vue';
import type { ObjectWithoutEmpty } from '@noeldemartin/utils';

import { requiredArrayProp } from '@/utils/vue';
import { translateWithDefault } from '@/lang';
import type { ErrorReport } from '@/errors';

export interface IAGErrorReportModalButtonsDefaultSlotProps {
    id: string;
    description: string;
    iconComponent: Component;
    url?: string;
    handler?(): void;
}

export const errorReportModalProps = {
    reports: requiredArrayProp<ErrorReport>(),
};

export type AGErrorReportModalProps = ObjectWithoutEmpty<ExtractPropTypes<typeof errorReportModalProps>>;

export function useErrorReportModalProps(): typeof errorReportModalProps {
    return errorReportModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useErrorReportModal(props: ExtractPropTypes<typeof errorReportModalProps>) {
    const activeReportIndex = ref(0);
    const report = computed(() => props.reports[activeReportIndex.value] as ErrorReport);
    const details = computed(
        () =>
            report.value.details ??
            // prettier fix
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

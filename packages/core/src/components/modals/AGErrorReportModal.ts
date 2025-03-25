import { computed, ref } from 'vue';
import type { Component, ExtractPropTypes } from 'vue';
import type { ObjectWithout, Pretty } from '@noeldemartin/utils';

import { requiredArrayProp } from '@aerogel/core/utils/vue';
import { translateWithDefault } from '@aerogel/core/lang';
import type { AcceptRefs } from '@aerogel/core/utils/vue';
import type { ErrorReport } from '@aerogel/core/errors';

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

export type AGErrorReportModalProps = Pretty<
    AcceptRefs<ObjectWithout<ExtractPropTypes<typeof errorReportModalProps>, null | undefined>>
>;

export function useErrorReportModalProps(): typeof errorReportModalProps {
    return errorReportModalProps;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useErrorReportModal(props: ExtractPropTypes<typeof errorReportModalProps>) {
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

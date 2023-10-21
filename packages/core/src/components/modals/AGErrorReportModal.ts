import type { Component } from 'vue';

import { requiredArrayProp } from '@/utils/vue';
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

export function useErrorReportModalProps(): typeof errorReportModalProps {
    return errorReportModalProps;
}

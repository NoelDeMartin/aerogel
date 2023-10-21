import { UIComponents } from '@aerogel/core';

import AlertModal from './modals/AlertModal.vue';
import ConfirmModal from './modals/ConfirmModal.vue';
import ErrorReportModal from './modals/ErrorReportModal.vue';
import LoadingModal from './modals/LoadingModal.vue';

export const components = {
    [UIComponents.AlertModal]: AlertModal,
    [UIComponents.ConfirmModal]: ConfirmModal,
    [UIComponents.ErrorReportModal]: ErrorReportModal,
    [UIComponents.LoadingModal]: LoadingModal,
};

import type { Job } from '@aerogel/core/jobs';
import { translateWithDefault } from '@aerogel/core/lang';
import { computed } from 'vue';

export interface LoadingModalProps {
    title?: string;
    message?: string;
    progress?: number;
    job?: Job;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useLoadingModal(props: LoadingModalProps) {
    const renderedTitle = computed(() => props.title ?? translateWithDefault('ui.loading', 'Loading'));
    const renderedMessage = computed(
        () => props.message ?? translateWithDefault('ui.loadingInProgress', 'Loading in progress...'),
    );
    const showProgress = computed(() => typeof props.progress === 'number' || !!props.job);
    const titleHidden = computed(() => !props.title);

    return { renderedTitle, renderedMessage, titleHidden, showProgress };
}

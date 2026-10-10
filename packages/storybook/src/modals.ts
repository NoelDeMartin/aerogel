import { createModal, modals, showModal } from '@aerogel/core';
import type { ModalController } from '@aerogel/core';
import { computed, defineComponent, h, onBeforeUnmount, onMounted } from 'vue';
import type { Component, PropType } from 'vue';

/**
 * Story parameters for modal stories.
 *
 * Modals are rendered with fixed positioning and a portal, so in docs pages each story is rendered
 * in its own iframe (otherwise, the overlays would cover the entire docs page).
 */
export const modalStoryParameters = {
    layout: 'fullscreen',
    docs: {
        story: {
            inline: false,
            iframeHeight: '500px',
        },
    },
};

// Modals are opened on mount, so their animations are disabled in order to render them in their final state right
// away. This only targets modal dialogs and their overlays (rendered right before them), so that animations within
// modals (such as loading spinners) still work.
const NO_MODAL_ANIMATIONS_CSS = `
    [role='dialog'],
    [data-state]:has(+ [role='dialog']) {
        animation: none !important;
        transition: none !important;
    }
`;

/**
 * Opens a modal on mount using the real modals stack (rendered by the `ModalsPortal` within `AppLayout`), so that it
 * looks and behaves exactly like it does in an app (including the overlay and nested modals). The modal can't be
 * dismissed, and the modal open animations are disabled while the story is mounted.
 *
 * Props are passed by reference, so updating them (for example, using Storybook controls) will update the open modal.
 */
export const ModalStory = defineComponent({
    name: 'ModalStory',
    props: {
        component: {
            type: Object as PropType<Component>,
            required: true,
        },
        props: {
            type: Object as PropType<Record<string, unknown>>,
            default: () => ({}),
        },
    },
    setup(props) {
        let restoreModal: (() => void) | null = null;

        function show(): () => void {
            const modalProps = Object.fromEntries(
                Object.keys(props.props).map((key) => [key, computed(() => props.props[key])]),
            );

            // oxlint-disable-next-line typescript/no-explicit-any
            const modal = createModal(props.component as any, modalProps) as ModalController;
            // oxlint-disable-next-line typescript/unbound-method -- These are closures, they don't use `this`.
            const { close, remove } = modal;

            // The modal is the story, so it shouldn't go away (this covers closing it with the keyboard, clicking
            // outside, or using any button within the modal).
            modal.close = async () => {};
            modal.remove = () => {};

            void showModal(modal);

            return () => Object.assign(modal, { close, remove });
        }

        function removeAll(): void {
            modals.value
                .slice(0)
                .reverse()
                .forEach((modal) => modal.remove());
        }

        onMounted(() => {
            removeAll();

            restoreModal = show();
        });

        onBeforeUnmount(() => {
            restoreModal?.();
            removeAll();
        });

        return () => h('style', NO_MODAL_ANIMATIONS_CSS);
    },
});

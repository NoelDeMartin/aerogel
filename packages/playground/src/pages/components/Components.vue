<template>
    <PageTitle source="src/pages/Components.vue">
        {{ $t('components.title') }}
    </PageTitle>

    <div class="prose-sm">
        <section>
            <h2>{{ $t('components.buttons') }}</h2>
            <div class="mt-4 flex items-center gap-2">
                <span>{{ $t('components.buttons_custom') }}:</span>
                <BaseButton>
                    {{ $t('components.buttons_clickMe') }}
                </BaseButton>
                <BaseButton color="danger">
                    {{ $t('components.buttons_clickMe') }}
                </BaseButton>
                <BaseButton color="clear">
                    {{ $t('components.buttons_clickMe') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex items-center gap-2">
                <span>{{ $t('components.buttons_customWithIcons') }}:</span>
                <BaseButton icon>
                    <i-mdi-check class="h-6 w-6" aria-hidden="true" />
                </BaseButton>
                <BaseButton icon color="danger">
                    <i-mdi-close class="h-6 w-6" aria-hidden="true" />
                </BaseButton>
                <BaseButton icon color="clear">
                    <i-mdi-help-circle-outline class="h-6 w-6" aria-hidden="true" />
                </BaseButton>
            </div>
            <div class="mt-4 flex items-center gap-2">
                <span>{{ $t('components.buttons_default') }}:</span>
                <AGButton>
                    {{ $t('components.buttons_clickMe') }}
                </AGButton>
                <AGButton color="secondary">
                    {{ $t('components.buttons_clickMe') }}
                </AGButton>
                <AGButton color="clear">
                    <i-mdi-help-circle-outline class="h-6 w-6" aria-hidden="true" />
                </AGButton>
            </div>
        </section>

        <section>
            <h2>{{ $t('components.inputs') }}</h2>
            <div class="mt-4 flex gap-2">
                <BaseInput
                    :label="$t('components.inputs_customLabel')"
                    :placeholder="$t('components.inputs_customPlaceholder')"
                />
                <label>
                    {{ $t('components.inputs_defaultLabel') }}
                    <AGInput :placeholder="$t('components.inputs_defaultPlaceholder')" class="mt-1" />
                </label>
            </div>
        </section>

        <section>
            <h2>{{ $t('components.checkboxes') }}</h2>
            <BaseCheckbox>{{ $t('components.checkboxes_custom') }}</BaseCheckbox>
            <AGCheckbox>{{ $t('components.checkboxes_default') }}</AGCheckbox>
        </section>

        <section>
            <h2>{{ $t('components.modals') }}</h2>
            <div class="mt-4 flex gap-2">
                <BaseButton
                    @click="$ui.alert($t('components.modals_alertTitle'), $t('components.modals_alertMessage'))"
                >
                    {{ $t('components.modals_customAlert') }}
                </BaseButton>
                <BaseButton
                    @click="
                        $ui.openModal(AGAlertModal, {
                            title: $t('components.modals_alertTitle'),
                            message: $t('components.modals_alertMessage'),
                        })
                    "
                >
                    {{ $t('components.modals_defaultAlert') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton @click="confirmResult($ui.confirm($t('components.modals_confirmMessage')))">
                    {{ $t('components.modals_customConfirm') }}
                </BaseButton>
                <BaseButton
                    @click="
                        $ui.openModal(AGConfirmModal, {
                            message: $t('components.modals_confirmMessage'),
                        }).then((modal) => confirmResult(modal.afterClose))
                    "
                >
                    {{ $t('components.modals_defaultConfirm') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton @click="$ui.loading(after({ seconds: 3 }))">
                    {{ $t('components.modals_customLoading') }}
                </BaseButton>
                <BaseButton @click="showDefaultLoading()">
                    {{ $t('components.modals_defaultLoading') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton @click="$ui.openModal(NestedModal)">
                    {{ $t('components.modals_nested') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton @click="$ui.openModal(CustomModal)">
                    {{ $t('components.modals_custom') }}
                </BaseButton>
            </div>
        </section>

        <section>
            <h2>{{ $t('components.snackbars') }}</h2>
            <div class="mt-4 flex gap-2">
                <BaseButton @click="$ui.showSnackbar($t('components.snackbars_message'))">
                    {{ $t('components.snackbars_custom') }}
                </BaseButton>
                <BaseButton @click="$ui.showSnackbar($t('components.snackbars_message'), { component: AGSnackbar })">
                    {{ $t('components.snackbars_default') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_customWithActions') }}
                </BaseButton>
                <BaseButton
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            component: AGSnackbar,
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_defaultWithActions') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            color: 'danger',
                        })
                    "
                >
                    {{ $t('components.snackbars_customDanger') }}
                </BaseButton>
                <BaseButton
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            component: AGSnackbar,
                            color: 'danger',
                        })
                    "
                >
                    {{ $t('components.snackbars_defaultDanger') }}
                </BaseButton>
            </div>
            <div class="mt-4 flex gap-2">
                <BaseButton
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            color: 'danger',
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_customDangerWithActions') }}
                </BaseButton>
                <BaseButton
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            component: AGSnackbar,
                            color: 'danger',
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_defaultDangerWithActions') }}
                </BaseButton>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { after } from '@noeldemartin/utils';
import { AGAlertModal, AGConfirmModal, AGLoadingModal, AGSnackbar, UI, translate } from '@aerogel/core';

import CustomModal from './components/CustomModal.vue';
import NestedModal from './components/NestedModal.vue';

async function confirmResult(result: Promise<unknown>) {
    const confirmed = await result;

    UI.alert(
        confirmed ? translate('components.modals_confirmConfirmed') : translate('components.modals_confirmCancelled'),
    );
}

async function showDefaultLoading(): Promise<void> {
    const modal = await UI.openModal(AGLoadingModal);

    await after({ seconds: 3 });

    UI.closeModal(modal.id);
}
</script>

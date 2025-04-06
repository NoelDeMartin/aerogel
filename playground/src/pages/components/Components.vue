<template>
    <PageTitle source="src/pages/Components.vue">
        {{ $t('components.title') }}
    </PageTitle>

    <div class="prose-sm">
        <section>
            <h2>{{ $t('components.buttons') }}</h2>
            <div class="mt-4 flex items-center gap-2">
                <span>{{ $t('components.buttons_variants') }}:</span>
                <Button> {{ $t('components.buttons_variants_default') }} </Button>
                <Button variant="secondary">
                    {{ $t('components.buttons_variants_secondary') }}
                </Button>
                <Button variant="danger">
                    {{ $t('components.buttons_variants_danger') }}
                </Button>
                <Button variant="ghost">
                    {{ $t('components.buttons_variants_ghost') }}
                </Button>
                <Button variant="outline">
                    {{ $t('components.buttons_variants_outline') }}
                </Button>
                <Button variant="link">
                    {{ $t('components.buttons_variants_link') }}
                </Button>
            </div>
            <div class="mt-4 flex items-center gap-2">
                <span>{{ $t('components.buttons_sizes') }}:</span>
                <Button size="small">
                    {{ $t('components.buttons_sizes_small') }}
                </Button>
                <Button size="default">
                    {{ $t('components.buttons_sizes_default') }}
                </Button>
                <Button size="large">
                    {{ $t('components.buttons_sizes_large') }}
                </Button>
                <Button size="icon">
                    <i-zondicons-close class="size-4" />
                </Button>
            </div>
        </section>

        <section>
            <h2>{{ $t('components.inputs') }}</h2>
            <div class="mt-4">
                <Input :label="$t('components.inputs_text')" :placeholder="$t('components.inputs_textPlaceholder')" />
            </div>
            <div class="mt-4">
                <Input
                    type="number"
                    :label="$t('components.inputs_number')"
                    :placeholder="$t('components.inputs_numberPlaceholder')"
                />
            </div>
            <div class="mt-4">
                <Input type="date" :label="$t('components.inputs_date')" />
            </div>
            <div class="mt-4">
                <Checkbox :label="$t('components.inputs_checkbox')" />
            </div>
        </section>

        <section>
            <h2>{{ $t('components.selects') }}</h2>
            <div class="not-prose mt-4 flex gap-2">
                <BaseSelect
                    v-model="customSelectValue"
                    class="min-w-[150px]"
                    :label="$t('components.selects_customLabel')"
                    :no-selection-text="$t('components.selects_customNoSelectionText')"
                    :options="
                        $t('components.selects_customOptions')
                            .split(',')
                            .map((o) => o.trim())
                    "
                />
                <AGSelect
                    v-model="defaultSelectValue"
                    class="min-w-[150px]"
                    :label="$t('components.selects_defaultLabel')"
                    :no-selection-text="$t('components.selects_defaultNoSelectionText')"
                    :options="
                        $t('components.selects_defaultOptions')
                            .split(',')
                            .map((o) => o.trim())
                    "
                />
            </div>
        </section>

        <section>
            <h2>{{ $t('components.modals') }}</h2>
            <div class="mt-4 flex gap-2">
                <Button @click="$ui.alert($t('components.modals_alertTitle'), $t('components.modals_alertMessage'))">
                    {{ $t('components.modals_alert') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button
                    @click="
                        $ui
                            .confirm($t('components.modals_confirmTitle'), $t('components.modals_confirmMessage'), {
                                acceptText: $t('components.modals_confirmAccept'),
                                cancelText: $t('components.modals_confirmCancel'),
                            })
                            .then((confirmed) => {
                                $ui.alert(
                                    confirmed
                                        ? $t('components.modals_confirmConfirmed')
                                        : $t('components.modals_confirmCancelled')
                                );
                            })
                    "
                >
                    {{ $t('components.modals_confirm') }}
                </Button>
                <Button
                    @click="
                        $ui
                            .confirm($t('components.modals_confirmTitle'), $t('components.modals_confirmMessage'), {
                                checkboxes: {
                                    terms: {
                                        label: $t('components.modals_confirmConditions'),
                                        required: true,
                                    },
                                },
                                acceptText: $t('components.modals_confirmAccept'),
                                cancelText: $t('components.modals_confirmCancel'),
                            })
                            .then(([confirmed]) => {
                                $ui.alert(
                                    confirmed
                                        ? $t('components.modals_confirmConfirmed')
                                        : $t('components.modals_confirmCancelled')
                                );
                            })
                    "
                >
                    {{ $t('components.modals_confirmWithCheckboxes') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button @click="$ui.loading($t('components.modals_loadingMessage'), after({ seconds: 3 }))">
                    {{ $t('components.modals_loading') }}
                </Button>
                <Button @click="showLoadingWithProgress()">
                    {{ $t('components.modals_loadingWithProgress') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button
                    @click="
                        $ui
                            .prompt($t('components.modals_promptTitle'), {
                                placeholder: $t('components.modals_promptPlaceholder'),
                            })
                            .then((name) => name && $ui.alert($t('components.modals_promptResult', { name })))
                    "
                >
                    {{ $t('components.modals_prompt') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button @click="$events.emit('all-the-way-down')">
                    {{ $t('components.modals_nested') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button @click="$ui.openModal(CustomModal)">
                    {{ $t('components.modals_custom') }}
                </Button>
            </div>
        </section>

        <section>
            <h2>{{ $t('components.snackbars') }}</h2>
            <div class="mt-4 flex gap-2">
                <Button @click="$ui.showSnackbar($t('components.snackbars_message'))">
                    {{ $t('components.snackbars_custom') }}
                </Button>
                <Button @click="$ui.showSnackbar($t('components.snackbars_message'), { component: AGSnackbar })">
                    {{ $t('components.snackbars_default') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_customWithActions') }}
                </Button>
                <Button
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            component: AGSnackbar,
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_defaultWithActions') }}
                </Button>
            </div>
            <div class="mt-4 flex gap-2">
                <Button
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            color: 'danger',
                        })
                    "
                >
                    {{ $t('components.snackbars_customDanger') }}
                </Button>
                <Button
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            component: AGSnackbar,
                            color: 'danger',
                        })
                    "
                >
                    {{ $t('components.snackbars_defaultDanger') }}
                </Button>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
                <Button
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            color: 'danger',
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_customDangerWithActions') }}
                </Button>
                <Button
                    @click="
                        $ui.showSnackbar($t('components.snackbars_message'), {
                            component: AGSnackbar,
                            color: 'danger',
                            actions: [{ text: $t('components.snackbars_action'), dismiss: true }],
                        })
                    "
                >
                    {{ $t('components.snackbars_defaultDangerWithActions') }}
                </Button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { after } from '@noeldemartin/utils';
import { AGSnackbar, UI, translate, useEvent } from '@aerogel/core';
import { ref } from 'vue';

import CustomModal from './components/CustomModal.vue';
import NestedModal from './components/NestedModal.vue';

const customSelectValue = ref(null);
const defaultSelectValue = ref(null);

async function showLoadingWithProgress() {
    const progress = ref(0);

    UI.loading(
        {
            message: translate('components.modals_loadingMessage'),
            progress,
        },
        after({ seconds: 3 }),
    );

    await after({ seconds: 1 });
    progress.value = 0.33;
    await after({ seconds: 1 });
    progress.value = 0.66;
    await after({ seconds: 1 });
    progress.value = 1;
}

useEvent('all-the-way-down', (count) => UI.openModal(NestedModal, { count }));
</script>

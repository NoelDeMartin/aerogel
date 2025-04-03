<template>
    <AGModal v-slot="{ close }: IModalDefaultSlotProps" :cancellable="false" :title="title">
        <AGMarkdown :text="message" />

        <AGForm :form="form" @submit="close(form.draft)">
            <AGInput name="draft" :placeholder="placeholder" :label="label" />

            <div class="mt-2 flex flex-row-reverse gap-2">
                <Button :variant="acceptColorVariant" submit>
                    {{ renderedAcceptText }}
                </Button>
                <Button :variant="cancelColorVariant" @click="close()">
                    {{ renderedCancelText }}
                </Button>
            </div>
        </AGForm>
    </AGModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { usePromptModal, usePromptModalProps } from '@aerogel/core/components/modals/AGPromptModal';
import { requiredStringInput, useForm } from '@aerogel/core/forms';
import type { IButtonVariants } from '@aerogel/core/components/contracts/Button';
import type { IModalDefaultSlotProps } from '@aerogel/core/components/contracts/Modal';

import AGModal from './AGModal.vue';
import Button from '../ui/Button.vue';
import AGForm from '../forms/AGForm.vue';
import AGInput from '../forms/AGInput.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(usePromptModalProps());
const form = useForm({ draft: requiredStringInput(props.defaultValue ?? '') });
const { renderedAcceptText, renderedCancelText } = usePromptModal(props);
const acceptColorVariant = computed(() => props.acceptColor as IButtonVariants);
const cancelColorVariant = computed(() => props.cancelColor as IButtonVariants);
</script>

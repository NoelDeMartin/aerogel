<template>
    <Modal v-slot="{ close }" :title="title" persistent>
        <AGForm :form="form" @submit="close([true, form.data()])">
            <AGMarkdown :text="message" :actions="actions" />

            <ul v-if="checkboxes" class="mt-4 flex flex-col text-sm text-gray-600">
                <li v-for="(checkbox, name) of checkboxes" :key="name">
                    <label class="flex items-center">
                        <input
                            v-model="form[name]"
                            type="checkbox"
                            :required="checkbox.required"
                            class="border-primary text-primary hover:bg-primary/10 hover:checked:bg-primary/80 focus:ring-primary focus-visible:ring-primary rounded border-2"
                        >
                        <span class="ml-1.5">{{ checkbox.label }}</span>
                    </label>
                </li>
            </ul>

            <div class="mt-4 flex flex-row-reverse gap-2">
                <Button :variant="acceptVariant" submit>
                    {{ renderedAcceptText }}
                </Button>
                <Button v-if="!required" :variant="cancelVariant" @click="close(false)">
                    {{ renderedCancelText }}
                </Button>
            </div>
        </AGForm>
    </Modal>
</template>

<script setup lang="ts">
import AGForm from '@aerogel/core/components/forms/AGForm.vue';
import AGMarkdown from '@aerogel/core/components/lib/AGMarkdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import { useConfirmModal } from '@aerogel/core/components/contracts/ConfirmModal';
import type { ConfirmModalProps } from '@aerogel/core/components/contracts/ConfirmModal';

const { cancelVariant = 'secondary', ...props } = defineProps<ConfirmModalProps>();
const { form, renderedAcceptText, renderedCancelText } = useConfirmModal(props);
</script>

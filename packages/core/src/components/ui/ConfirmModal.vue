<template>
    <!-- @vue-generic {import('@aerogel/core/components/contracts/ConfirmModal').ConfirmModalResult} -->
    <Modal
        v-slot="{ close }"
        :title="renderedTitle"
        :title-hidden="titleHidden"
        persistent
    >
        <Form :form @submit="close([true, form.data()])">
            <Markdown :text="message" :actions />

            <ul v-if="checkboxes" class="mt-4 flex flex-col text-sm text-gray-600">
                <li v-for="(checkbox, name) of checkboxes" :key="name">
                    <label class="flex items-center">
                        <input
                            v-model="form[name]"
                            type="checkbox"
                            :required="checkbox.required"
                            class="border-primary-600 text-primary-600 hover:bg-primary-50 hover:checked:bg-primary-500 focus:ring-primary-600 focus-visible:ring-primary-600 rounded border-2"
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
        </Form>
    </Modal>
</template>

<script setup lang="ts">
import Form from '@aerogel/core/components/ui/Form.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import { useConfirmModal } from '@aerogel/core/components/contracts/ConfirmModal';
import type {
    ConfirmModalEmits,
    ConfirmModalExpose,
    ConfirmModalProps,
} from '@aerogel/core/components/contracts/ConfirmModal';

const { cancelVariant = 'secondary', ...props } = defineProps<ConfirmModalProps>();
const { form, renderedTitle, titleHidden, renderedAcceptText, renderedCancelText } = useConfirmModal(props);

defineEmits<ConfirmModalEmits>();
defineExpose<ConfirmModalExpose>();
</script>

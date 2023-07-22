<template>
    <Story>
        <Variant title="Primary">
            <StateVariants>
                <AppButton :color="color" :small="small">
                    {{ content }}
                </AppButton>

                <template #hover>
                    <AppButton :color="color" :small="small" class=":hover">
                        {{ content }}
                    </AppButton>
                </template>

                <template #focus>
                    <AppButton :color="color" :small="small" class=":focus :focus-visible">
                        {{ content }}
                    </AppButton>
                </template>
            </StateVariants>

            <template #controls>
                <HstText v-model="content" title="Content" />
                <HstCheckbox v-model="small" title="Small" />
                <HstSelect v-model="color" title="Color" :options="colorOptions" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { invert } from '@noeldemartin/utils';
import { ref } from 'vue';

import { Colors } from '@/components';

const content = ref('Click me!');
const small = ref(false);
const color = ref(Colors.Primary);
const colorOptions = invert(Colors);
</script>

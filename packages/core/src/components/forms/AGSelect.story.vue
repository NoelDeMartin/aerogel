<template>
    <Story>
        <div class="h-96">
            <AGSelect v-model="bestMugiwara" :label="label" :options="options" />
        </div>
    </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import AGSelect from './AGSelect.vue';

const bestMugiwara = ref(null);
const label = 'Who\'s the best Mugiwara?';
const options = [
    'Monkey D. Luffy',
    'Roronoa Zoro',
    'Nami',
    'Usopp',
    'Sanji',
    'Tony Tony Chopper',
    'Nico Robin',
    'Franky',
    'Brook',
    'Jinbe',
];
</script>

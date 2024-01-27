<template>
    <Story>
        <div class="h-96">
            <AGSelect v-model="bestMugiwara" :label="bestMugiwaraLabel" :options="bestMugiwaraOptions" />
            <AGSelect
                v-model="bestFood"
                :label="bestFoodLabel"
                :options="bestFoodOptions"
                options-text="name"
            />
        </div>
    </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import AGSelect from './AGSelect.vue';

const bestMugiwara = ref(null);
const bestFood = ref(null);
const bestMugiwaraLabel = 'Who\'s the best Mugiwara?';
const bestFoodLabel = 'What\'s the best food?';
const bestMugiwaraOptions = [
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
const bestFoodOptions = [
    {
        id: 'ramen',
        name: 'Ramen',
    },
    {
        id: 'pizza',
        name: 'Pizza',
    },
];
</script>

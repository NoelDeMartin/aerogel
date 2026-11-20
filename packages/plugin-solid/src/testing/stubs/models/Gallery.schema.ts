import { arraySorted } from '@noeldemartin/utils';
import { InvalidationStrategies, defineSchema, isContainedBy, loaded } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'ImageGallery',
    fields: {
        name: z.string(),
    },
    relations: {
        container: isContainedBy('Container'),
    },
    computed: {
        imageUrls: {
            invalidationStrategy: InvalidationStrategies.Container,
            compute: (gallery): string[] => arraySorted(loaded(gallery, 'container')?.fileUrls ?? []),
        },
    },
});

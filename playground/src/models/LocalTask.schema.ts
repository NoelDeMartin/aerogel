import { defineSolidModelSchema } from 'soukai-solid';

import SolidTask from '@/models/SolidTask';

export default defineSolidModelSchema(SolidTask, {
    history: true,
    tombstone: false,
});

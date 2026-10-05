import { urlRoute } from '@noeldemartin/utils';

import Model from './Post.schema';

export default class Post extends Model {
    public override getSlug(): string | null {
        return this.url ? (urlRoute(this.url).split('/').pop() ?? null) : null;
    }
}

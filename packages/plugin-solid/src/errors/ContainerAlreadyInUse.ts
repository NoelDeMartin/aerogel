import { JSError } from '@noeldemartin/utils';
import type { JSErrorOptions } from '@noeldemartin/utils';
import type { SolidContainer } from 'soukai-solid';

export default class ContainerAlreadyInUse extends JSError {

    constructor(container: SolidContainer, options?: JSErrorOptions) {
        super(`Container at ${container.url} is already in use`, options);
    }

}

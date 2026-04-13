import { JSError } from '@noeldemartin/utils';
import type { JSErrorOptions } from '@noeldemartin/utils';
import type { Container } from 'soukai-bis';

export default class ContainerAlreadyInUse extends JSError {

    constructor(container: Container, options?: JSErrorOptions) {
        super(`Container at ${container.url} is already in use`, options);
    }

}

import { Service } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';

export class <% service.name %>Service extends Service {

}

export default facade(new <% service.name %>Service());

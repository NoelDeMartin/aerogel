import { MagicObject } from '@noeldemartin/utils';
import { reactive } from 'vue';
import type { ObjectValues } from '@noeldemartin/utils';

export const FormFieldTypes = {
    String: 'string',
} as const;

export interface FormFieldDefinition<T extends FormFieldType = FormFieldType> {
    type: T;
    default?: GetFormFieldValue<T>;
}

export type FormFieldDefinitions = Record<string, FormFieldDefinition>;
export type FormFieldType = ObjectValues<typeof FormFieldTypes>;

export type FormData<T> = {
    [k in keyof T]: GetFormFieldValue<T[k]> | null;
};

export type GetFormFieldValue<TDefinition> = TDefinition extends FormFieldDefinition<infer TType>
    ? TType extends typeof FormFieldTypes.String
        ? string
        : never
    : never;

export default class Form<Fields extends FormFieldDefinitions = FormFieldDefinitions> extends MagicObject {

    private fields: Fields;
    private data: FormData<Fields>;

    constructor(fields: Fields) {
        super();

        this.fields = fields;
        this.data = this.getInitialData(fields);
    }

    public setFieldValue<T extends keyof Fields>(field: T, value: GetFormFieldValue<Fields[T]>): void {
        this.data[field] = value;
    }

    public getFieldValue<T extends keyof Fields>(field: T): GetFormFieldValue<Fields[T]> {
        return this.data[field] as GetFormFieldValue<Fields[T]>;
    }

    protected __get(property: string): unknown {
        if (!(property in this.fields)) {
            return super.__get(property);
        }

        return this.data[property];
    }

    protected __set(property: string, value: unknown): void {
        if (!(property in this.fields)) {
            super.__set(property, value);

            return;
        }

        Object.assign(this.data, { [property]: value });
    }

    private getInitialData(fields: Fields): FormData<Fields> {
        if (this.static().isConjuring()) {
            return {} as FormData<Fields>;
        }

        const data = Object.entries(fields).reduce((data, [name, definition]) => {
            data[name as keyof Fields] = definition.default ?? null;

            return data;
        }, {} as FormData<Fields>);

        return reactive(data) as FormData<Fields>;
    }

}

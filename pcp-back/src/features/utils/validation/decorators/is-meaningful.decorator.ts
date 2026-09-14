import { ValidationOptions, registerDecorator } from 'class-validator';
import { IsMeaningfulConstraint } from '../is-meaningful-constrain';

export function IsMeaningful(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsMeaningfulConstraint,
		});
	};
}

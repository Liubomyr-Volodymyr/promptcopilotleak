import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsMeaningfulConstraint implements ValidatorConstraintInterface {
	private readonly minAlphaRatio = 0.5;

	validate(input: string) {
		if (!input) return false;
		const trimmed = input.trim();
		if (!trimmed) return false;

		const letters = (trimmed.match(/\p{L}/gu) || []).length;
		const ratio = letters / Math.max(1, trimmed.length);
		if (ratio < this.minAlphaRatio) return false;
		if (/^(..+)\1{3,}$/.test(trimmed)) return false;
		if (/^(.)\1{4,}$/.test(trimmed)) return false;
		if (/^[\p{P}\p{S}\d]+$/u.test(trimmed)) return false;

		return true;
	}

	defaultMessage() {
		return 'Input does not appear to be meaningful text';
	}
}

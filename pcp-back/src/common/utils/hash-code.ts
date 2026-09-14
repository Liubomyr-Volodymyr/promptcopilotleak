import { createHash } from 'crypto';

export const hashCode = (code: string) => {
	return createHash('sha256').update(code).digest('hex');
};

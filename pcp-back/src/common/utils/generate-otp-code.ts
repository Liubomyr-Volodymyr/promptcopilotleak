import { randomInt } from 'crypto';

export const generateOtp = () => String(randomInt(100000, 1000000));

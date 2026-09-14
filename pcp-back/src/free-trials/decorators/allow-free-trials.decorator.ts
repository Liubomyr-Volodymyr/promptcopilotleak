import { SetMetadata } from '@nestjs/common';

export const FREE_TRIALS_META = 'free_trials_meta';

export enum FreeReqPeriod {
	DAY = 86400,
	WEEK = 604800,
}
export type FreeTrialsMeta = {
	key: string;
	limit: number;
	windowSec: number;
};

export const AllowFreeTrials = (
	key: string,
	limit = 5,
	windowSec = FreeReqPeriod.DAY,
) =>
	SetMetadata(FREE_TRIALS_META, {
		key,
		limit,
		windowSec,
	} as FreeTrialsMeta);

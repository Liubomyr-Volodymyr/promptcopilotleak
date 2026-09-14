export const AUTOCOMPLETE_LIMITS = {
	default: { ttl: 60000, limit: 30 },
	minute: { ttl: 60000, limit: 30 },
	hour: { ttl: 60 * 60000, limit: 200 },
	day: { ttl: 24 * 60 * 60000, limit: 2000 },
};

export const ENHANCE_LIMITS = {
	default: { ttl: 60000, limit: 5 },
	minute: { ttl: 60000, limit: 5 },
	hour: { ttl: 60 * 60000, limit: 40 },
	day: { ttl: 24 * 60 * 60000, limit: 200 },
};

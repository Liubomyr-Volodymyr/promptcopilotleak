import { ProfileType } from '../entities/profile.entity';

/**
 * Get the short label for a profile type
 * Used in Dashboard - Context Profiles list and GPTs pop-up
 * @param type - The profile type
 * @returns Short label: "Text" or "Search"
 */
export function getProfileLabelShort(type: ProfileType | string): string {
	if (type === ProfileType.SEARCH) {
		return 'Search';
	}
	return 'Text';
}

/**
 * Get the full label for a profile type
 * Used in Dashboard - Profile Detailed pop-up
 * @param type - The profile type
 * @returns Full label: "Text - Work", "Text - Personal", or "Search"
 */
export function getProfileLabelFull(type: ProfileType | string): string {
	if (type === ProfileType.SEARCH) {
		return 'Search';
	}
	if (type === ProfileType.BUSINESS) {
		return 'Text - Work';
	}
	if (type === ProfileType.PERSONAL) {
		return 'Text - Personal';
	}
	// Fallback to short label if type is unknown
	return getProfileLabelShort(type);
}

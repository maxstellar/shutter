import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

function validDate(val: string | undefined): string | null {
	if (!val) return null;
	return /^\d{4}-\d{2}-\d{2}$/.test(val.trim()) ? val.trim() : null;
}

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const raw = cookies.get('theme');
	const theme = raw === 'dark' || raw === 'light' ? raw : null;

	return {
		user: locals.user,
		isAdmin: locals.isAdmin,
		isWhitelisted: locals.isWhitelisted,
		theme,
		cohortStart: validDate(env.COHORT_START),
		cohortEnd: validDate(env.COHORT_END)
	};
};

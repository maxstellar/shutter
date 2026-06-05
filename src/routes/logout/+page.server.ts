import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth/session';

export const actions: Actions = {
	default: async (event) => {
		await deleteSession(event);
		throw redirect(303, '/login');
	}
};

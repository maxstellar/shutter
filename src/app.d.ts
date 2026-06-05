import type { InferSelectModel } from 'drizzle-orm';
import type { users, sessions } from '$lib/server/db/schema';

type User = InferSelectModel<typeof users>;
type Session = InferSelectModel<typeof sessions>;

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
			isWhitelisted: boolean;
			isAdmin: boolean;
		}
		interface PageData {
			user: User | null;
			isAdmin: boolean;
			theme: 'light' | 'dark' | null;
		}
	}
}

export {};

import { error } from '@sveltejs/kit';

const ET_FORMATTER = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'America/New_York',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const ET_HOUR_FORMATTER = new Intl.DateTimeFormat('en-US', {
	timeZone: 'America/New_York',
	hour: 'numeric',
	hour12: false
});

export function currentETDay(): string {
	return ET_FORMATTER.format(new Date());
}

export function currentETHour(): number {
	return parseInt(ET_HOUR_FORMATTER.format(new Date()), 10);
}

export function etDayOf(date: Date): string {
	return ET_FORMATTER.format(date);
}

// Throws 403 if the given day is not today in ET (user uploads/deletes lock at midnight ET)
export function assertUserDayEditable(day: string): void {
	if (day !== currentETDay()) {
		error(403, 'This day is locked');
	}
}

// Admins have a 24h grace window: can edit today and yesterday only
export function assertAdminDayEditable(day: string): void {
	const today = currentETDay();
	if (day > today) error(403, 'Cannot edit a future day');
	const d = new Date(today + 'T12:00:00');
	d.setDate(d.getDate() - 1);
	const yesterday = d.toISOString().slice(0, 10);
	if (day < yesterday) error(403, 'This day is outside the 24-hour edit window');
}

export function adminEditableDays(): { today: string; yesterday: string } {
	const today = currentETDay();
	const d = new Date(today + 'T12:00:00');
	d.setDate(d.getDate() - 1);
	return { today, yesterday: d.toISOString().slice(0, 10) };
}

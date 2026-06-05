import { env } from '$env/dynamic/private';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface CdnResult {
	url: string;
	key?: string;
}

export interface CdnUploader {
	upload(buffer: Buffer, filename: string, mimeType: string): Promise<CdnResult>;
}

export function createHackClubCdnUploader(): CdnUploader {
	const token = env.HACKCLUB_CDN_TOKEN;
	if (!token) throw new Error('HACKCLUB_CDN_TOKEN is not set');

	return {
		async upload(buffer, filename, mimeType) {
			const form = new FormData();
			form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

			const res = await fetch('https://cdn.hackclub.com/api/v4/upload', {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: form
			});

			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(`CDN upload failed ${res.status}: ${text}`);
			}

			const data = await res.json();
			// API returns { url, key } or just a URL string — handle both shapes
			if (typeof data === 'string') return { url: data };
			return { url: data.url ?? data.files?.[0] ?? data, key: data.key };
		}
	};
}

// Dev-only: writes to ./uploads/ and serves via static files
export function createLocalDiskUploader(): CdnUploader {
	return {
		async upload(buffer, filename) {
			const dir = join(process.cwd(), 'uploads');
			await mkdir(dir, { recursive: true });
			const name = `${Date.now()}-${filename}`;
			await writeFile(join(dir, name), buffer);
			return { url: `/uploads/${name}`, key: name };
		}
	};
}

export function getUploader(): CdnUploader {
	if (env.HACKCLUB_CDN_TOKEN) {
		return createHackClubCdnUploader();
	}
	// Fall back to local disk in dev when CDN token not set
	return createLocalDiskUploader();
}

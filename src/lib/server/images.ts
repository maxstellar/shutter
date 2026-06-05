import { imageSize } from 'image-size';
import { error } from '@sveltejs/kit';

const ACCEPTED_MIMES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif'
]);

// Magic-number prefix patterns for supported image types
const MAGIC: Array<{ mime: string; check: (b: Buffer) => boolean }> = [
	{ mime: 'image/jpeg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
	{ mime: 'image/png', check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
	{ mime: 'image/webp', check: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
	{
		mime: 'image/heic',
		check: (b) => {
			const ftyp = b.slice(4, 8).toString('ascii');
			const brand = b.slice(8, 12).toString('ascii');
			return ftyp === 'ftyp' && (brand === 'heic' || brand === 'heix' || brand === 'mif1' || brand === 'hevc');
		}
	}
];

export function sniffMime(buffer: Buffer): string {
	if (buffer.length < 12) error(400, 'File too small to identify');
	for (const { mime, check } of MAGIC) {
		if (check(buffer)) return mime;
	}
	error(400, 'Unsupported file type — please upload a JPEG, PNG, WebP, or HEIC photo');
}

export function validateMime(mime: string): void {
	if (!ACCEPTED_MIMES.has(mime)) {
		error(400, 'Unsupported file type');
	}
}

export function getDimensions(buffer: Buffer): { width: number | undefined; height: number | undefined } {
	try {
		const result = imageSize(buffer);
		return { width: result.width, height: result.height };
	} catch {
		return { width: undefined, height: undefined };
	}
}

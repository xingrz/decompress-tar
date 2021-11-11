import type { File } from '@xingrz/decompress-types';
import type { Readable } from 'stream';
import * as fileType from 'file-type';
import tarStream from 'tar-stream';
import isStream from 'is-stream';
import pond from 'pond';
import { once } from 'events';

export default () => async (input: Buffer | Readable): Promise<File[]> => {
	const isBuffer = Buffer.isBuffer(input);
	const type = isBuffer ? await fileType.fromBuffer(input) : null;

	if (!isBuffer && !isStream(input)) {
		throw new TypeError(`Expected a Buffer or Stream, got ${typeof input}`);
	}

	if (isBuffer && (!type || type.ext !== 'tar')) {
		return [];
	}

	const extract = tarStream.extract();
	const files: File[] = [];

	extract.on('entry', async (header, stream, next) => {
		const file: File = {
			data: await pond(stream).spoon(),
			mode: header.mode!,
			mtime: header.mtime!,
			path: header.name,
			type: header.type!,
		};

		if (header.type === 'symlink' || header.type === 'link') {
			file.linkname = header.linkname!;
		}

		files.push(file);
		next();
	});

	if (Buffer.isBuffer(input)) {
		extract.end(input);
	} else {
		input.pipe(extract);
	}

	await once(extract, 'finish');
	return files;
};

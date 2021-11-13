import type { DecompressPlugin, DecompressPluginOptions, File } from '@xingrz/decompress-types';
import * as fileType from 'file-type';
import tarStream from 'tar-stream';
import isStream from 'is-stream';
import pond from 'pond';
import { once } from 'events';

export default (): DecompressPlugin<DecompressPluginOptions> => async (input, opts) => {
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
		if (!header.mode || !header.mtime || !header.type) {
			return next();
		}

		if (header.type != 'file' && header.type != 'directory' && header.type != 'symlink' && header.type != 'link') {
			return next();
		}

		const file: File = {
			mode: header.mode,
			mtime: header.mtime,
			path: header.name,
			type: header.type,
		};

		if (header.type === 'symlink' || header.type === 'link') {
			file.linkname = header.linkname!;
		} else if (header.type == 'file') {
			try {
				if (opts?.fileWriter) {
					await opts.fileWriter(file, stream);
				} else {
					file.data = await pond(stream).spoon();
				}
			} catch (e) {
				return next(e);
			}
		}

		files.push(file);
		next();
	});

	if (Buffer.isBuffer(input)) {
		extract.end(input);
	} else {
		input.once('error', e => extract.emit('error', e));
		input.pipe(extract);
	}

	await once(extract, 'finish');
	return files;
};

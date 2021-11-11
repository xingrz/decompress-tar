import { readFileSync, createReadStream } from 'fs';
import { Stream } from 'stream';
import { join } from 'path';
import fileType from 'file-type';
import m from '../src';

const FIXTURES_DIR = join(__dirname, 'fixtures');

async function isJpg(buf: Buffer): Promise<boolean> {
	return (await fileType.fromBuffer(buf))?.ext == 'jpg';
}

test('extract file', async () => {
	const buf = readFileSync(join(FIXTURES_DIR, 'file.tar'));
	const files = await m()(buf);

	expect(files[0].path).toBe('test.jpg');
	expect(files[0].data && await isJpg(files[0].data)).toBe(true);
});

test('extract file using streams', async () => {
	const stream = createReadStream(join(FIXTURES_DIR, 'file.tar'));
	const files = await m()(stream);

	expect(files[0].path).toBe('test.jpg');
	expect(files[0].data && await isJpg(files[0].data)).toBe(true);
});

test('extract file to fileWriter', async () => {
	const fileWriter = jest.fn().mockResolvedValue(null);

	const buf = readFileSync(join(FIXTURES_DIR, 'file.tar'));
	const files = await m()(buf, { fileWriter });

	expect(files[0].path).toBe('test.jpg');
	expect(files[0].data).toBeUndefined();

	expect(fileWriter).toHaveBeenCalledTimes(1);
	expect(fileWriter.mock.calls[0][0]).toHaveProperty('path', 'test.jpg');
	expect(fileWriter.mock.calls[0][1]).toBeInstanceOf(Stream);
});

test('extract symlinks', async () => {
	const buf = readFileSync(join(FIXTURES_DIR, 'symlink.tar'));
	const files = await m()(buf);

	expect(files[0].path).toBe('test-symlink/symlink');
	expect(files[0].type).toBe('symlink');
	expect(files[0].linkname).toBe('file.txt');
	expect(files[1].path).toBe('test-symlink/file.txt');
	expect(files[1].type).toBe('file');
});

test('return empty array if non-valid file is supplied', async () => {
	const buf = readFileSync(__filename);
	const files = await m()(buf);

	expect(files.length).toBe(0);
});

test('throw on wrong input', async () => {
	await expect(m()('foo' as unknown as Buffer))
		.rejects.toThrow('Expected a Buffer or Stream, got string');
});

test('throw once fileWriter throwed', async () => {
	const fileWriter = jest.fn().mockRejectedValue(new Error('Test throw'));
	const buf = readFileSync(join(FIXTURES_DIR, 'file.tar'));
	await expect(m()(buf, { fileWriter }))
		.rejects.toThrow('Test throw');
});

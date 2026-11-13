import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Only displayed pre/code text is frozen; managed CDN URLs are in scripts.
const textHashes = {
	'index.html': [
		'b12e216da1172ecea4f337a5d469b44943b9b4aefd22b2bc838c9b0fa43c227f',
		'3e4e290df02bb5485d6ccdce208f8adcbff7f00b0ac02666d74781947c6e3807',
		'0c66c2a185e569c9b363c770d571b6e91abf074442009db23b84367c1951c7ca',
		'466a3f46fb722273a7ed4bd41661dbc1e32376ff2b7716628ea5c80f28352ea2',
		'62ca9326dbcb077ff835f2cea0ad953bb779cd8a8083e1183809541114c2de5e',
		'a7d8182a4ea57f097f2b7f92bb0b5ad3cfc3355f9eea6c6881d5c51093ecccf0',
		'4132aa68ebee53b1566212c69e39fccb16ca6dc8c989fdb3c885b47174f648e4',
		'c9143a1a552128e71fe4079b472041de29a3e5ed34cdbf7450045ea5a14a6d7e',
		'b58091a032905e55838db579d5c4e8439b79b496d5f6acbce5946a132be1d626',
		'02d5fee5139b1980b3d8b9d3a6205cc61dd6f1c3a7458152dc9829eb11202f9b',
		'b707eef4f6c0d6ce758f0fa6d3167e545fc5f07fa587609fd8263933c973afb3',
		'17049d875baadf5b6c015b5304ce36cc047b533a5e99f536b86b1fe83cdacfda',
	],
	'esm.html': [
		'3e28057facc756c7c599f38ee465dfd4458c3676fe194ba79db511a9c16fe4b1',
	],
	'unpkg.html': [
		'3e28057facc756c7c599f38ee465dfd4458c3676fe194ba79db511a9c16fe4b1',
	],
};

function parseSnippets(html) {
	const template = document.createElement('template');
	template.innerHTML = html;
	return [...template.content.querySelectorAll('pre code')];
}

async function snippets(name) {
	return parseSnippets(await readFile(resolve('demo', name), 'utf8'));
}

describe('displayed component-code highlighting', () => {
	it('accepts a future publishing-helper version update without freezing the CDN URL', async () => {
		const packagePath = resolve('package.json');
		const demoPath = resolve('demo/esm.html');
		const packageText = await readFile(packagePath, 'utf8');
		const originalDemo = await readFile(demoPath, 'utf8');
		const packageJson = JSON.parse(packageText);
		const futureVersion = '99.2.1';
		const files = new Map([
			[
				packagePath,
				JSON.stringify({ ...packageJson, version: futureVersion }),
			],
			[demoPath, originalDemo],
		]);
		const writeFileSync = vi.fn((path, content) => {
			expect(path).toBe(demoPath);
			files.set(path, content);
		});
		vi.doMock('fs', () => ({
			readFileSync: (path) => {
				if (!files.has(path))
					throw new Error(`Unexpected fixture path: ${path}`);
				return files.get(path);
			},
			writeFileSync,
		}));
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		try {
			await import('../scripts/update-demo-versions.js');
			expect(writeFileSync).toHaveBeenCalledTimes(1);
			const updatedDemo = files.get(demoPath);
			expect(updatedDemo).toContain(
				`${packageJson.name}@${futureVersion}/form-required-if.js`,
			);
			expect(updatedDemo).not.toContain(
				`${packageJson.name}@${packageJson.version}/form-required-if.js`,
			);
			const updatedSnippets = parseSnippets(updatedDemo);
			expect(
				updatedSnippets.map((code) =>
					createHash('sha256').update(code.textContent).digest('hex'),
				),
			).toEqual(textHashes['esm.html']);
			expect(
				updatedSnippets.map((code) =>
					[...code.querySelectorAll('mark')].map(
						(mark) => mark.textContent,
					),
				),
			).toEqual(
				parseSnippets(originalDemo).map((code) =>
					[...code.querySelectorAll('mark')].map(
						(mark) => mark.textContent,
					),
				),
			);
			expect(await readFile(packagePath, 'utf8')).toBe(packageText);
			expect(await readFile(demoPath, 'utf8')).toBe(originalDemo);
		} finally {
			vi.doUnmock('fs');
			log.mockRestore();
		}
	});

	for (const [name, hashes] of Object.entries(textHashes)) {
		it(`${name}: preserves the exact text of every existing snippet`, async () => {
			expect(
				(await snippets(name)).map((code) =>
					createHash('sha256').update(code.textContent).digest('hex'),
				),
			).toEqual(hashes);
		});

		it(`${name}: marks complete component tags once, leaving generic code unmarked`, async () => {
			for (const code of await snippets(name)) {
				// Quoted indicator HTML can itself contain angle brackets.
				const tags = [
					...code.textContent.matchAll(
						/<\/?form-required-if\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/g,
					),
				].map(([tag]) => tag);
				expect(tags.length).toBeGreaterThan(0);
				expect(code.querySelector('mark mark')).toBeNull();
				expect(
					[...code.querySelectorAll('mark')].map(
						(mark) => mark.textContent,
					),
				).toEqual(tags);
				const unmarked = code.cloneNode(true);
				for (const mark of unmarked.querySelectorAll('mark'))
					mark.remove();
				expect(unmarked.textContent).not.toMatch(
					/<\/?form-required-if\b|FormRequiredIfElement|defineFormRequiredIf|customElements\.(?:get|define)|@aarongustafson\/form-required-if/,
				);
			}
		});
	}
});

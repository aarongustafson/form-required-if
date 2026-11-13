import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const textHashes = {
	'index.html': [
		'9548e441ab3d38b6391e026f585cda5ae41882d097b198660ca66cbdd4ac412c',
		'8db97d7b2639bec85d1c0d6b292b3a6f680fa7bd2c5f3b0d0232eb0de605fa1e',
		'2bf3aae99a1704184d96e4c0cd5a8fa7fdb1e8ec03230047b829c36bc59ba5cc',
		'466a3f46fb722273a7ed4bd41661dbc1e32376ff2b7716628ea5c80f28352ea2',
		'62ca9326dbcb077ff835f2cea0ad953bb779cd8a8083e1183809541114c2de5e',
		'6bfa6625f5a803061b2a46939c10eff42ab74fbc76105b3b72e047a7015aa1c0',
		'ef3eb673c8ad876ec0e473913c87c6f509ea295633fc3625ef43e7b8c7c02bef',
		'c9143a1a552128e71fe4079b472041de29a3e5ed34cdbf7450045ea5a14a6d7e',
		'b58091a032905e55838db579d5c4e8439b79b496d5f6acbce5946a132be1d626',
		'02d5fee5139b1980b3d8b9d3a6205cc61dd6f1c3a7458152dc9829eb11202f9b',
		'1cafd4b9295a39e9723f54ef823370f7e3d2b3a38854f3085d2c107a9027766d',
		'17049d875baadf5b6c015b5304ce36cc047b533a5e99f536b86b1fe83cdacfda',
	],
	'esm.html': [
		'118dfda48bd589aeb063bdb9300fabb4bfa8357a4e6b1cc308babc6d8b9c048c',
	],
	'unpkg.html': [
		'118dfda48bd589aeb063bdb9300fabb4bfa8357a4e6b1cc308babc6d8b9c048c',
	],
};

async function snippets(name) {
	const template = document.createElement('template');
	template.innerHTML = await readFile(resolve('demo', name), 'utf8');
	return [...template.content.querySelectorAll('pre code')];
}

describe('displayed component-code highlighting', () => {
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

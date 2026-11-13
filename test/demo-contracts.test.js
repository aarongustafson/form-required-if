import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFile(resolve(process.cwd(), path), 'utf8');

describe('demo and publishing contracts', () => {
	it('keeps every live demo form natively non-submitting without a script dependency', async () => {
		for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
			const template = document.createElement('template');
			template.innerHTML = await read(`demo/${name}`);
			const forms = template.content.querySelectorAll('form');
			expect(forms.length, name).toBeGreaterThan(0);
			for (const form of forms) {
				expect(form.getAttribute('method'), name).toBe('dialog');
				expect(form.hasAttribute('action'), name).toBe(false);
				expect(form.closest('dialog'), name).toBeNull();
				expect(form.hasAttribute('novalidate'), name).toBe(false);
			}
		}
	});

	it('links demo README navigation to rendered documentation', async () => {
		for (const name of (await readdir('demo')).filter((name) =>
			name.endsWith('.html'),
		)) {
			const template = document.createElement('template');
			template.innerHTML = await read(`demo/${name}`);
			const links = [
				...template.content.querySelectorAll('a:not([download])'),
			].filter((link) => link.textContent.trim() === 'README');
			expect(links.length, name).toBeGreaterThan(0);
			for (const link of links) {
				expect(link.getAttribute('href'), name).toBe(
					'https://github.com/aarongustafson/form-required-if/blob/main/README.md',
				);
			}
		}
	});

	it('keeps the versioned demo, staging, tag-push, and publishing automation', async () => {
		const packageJson = JSON.parse(await read('package.json'));
		expect(packageJson.scripts.version).toBe(
			'node scripts/update-demo-versions.js && git add demo/esm.html',
		);
		expect(packageJson.scripts.postversion).toBe('git push --follow-tags');
		expect(await read('demo/esm.html')).toContain(
			`${packageJson.name}@${packageJson.version}/form-required-if.js`,
		);
		expect(await read('scripts/update-demo-versions.js')).toContain(
			'writeFileSync(esmPath',
		);
		expect(await read('.github/workflows/publish.yml')).toContain(
			'npm publish',
		);
	});

	it('reuses existing help text without duplicate messages or label text', async () => {
		const { document } = window;
		for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
			const template = document.createElement('template');
			template.innerHTML = await read(`demo/${name}`);
			expect(
				template.content.querySelector('.required-message'),
				name,
			).toBeNull();
			expect(
				template.content.querySelectorAll('.demo small').length,
				name,
			).toBe(name === 'index.html' ? 7 : 0);
			for (const host of template.content.querySelectorAll(
				'form-required-if',
			)) {
				const field = host.querySelector('input, select, textarea');
				const description = host.querySelector('small');
				if (description) {
					expect(description.id, name).not.toBe('');
					expect(field.getAttribute('aria-describedby'), name).toBe(
						description.id,
					);
					expect(description.closest('label'), name).toBeNull();
					const pair = host.closest('.code-demo-pair');
					const example = document.createElement('template');
					example.innerHTML =
						pair.querySelector('pre code').textContent;
					const shownDescription = example.content.getElementById(
						description.id,
					);
					expect(shownDescription?.textContent.trim(), name).toBe(
						description.textContent.trim().replace(/\s+/g, ' '),
					);
					expect(
						example.content.querySelector(
							`[aria-describedby="${description.id}"]`,
						),
						name,
					).not.toBeNull();
				} else {
					expect(field.hasAttribute('aria-describedby'), name).toBe(
						false,
					);
				}
			}
		}
	});
});

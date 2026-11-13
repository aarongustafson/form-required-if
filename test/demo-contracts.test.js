import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFile(resolve(process.cwd(), path), 'utf8');

describe('demo and publishing contracts', () => {
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

	it('gives every conditional control authored required instructions', async () => {
		const { document } = window;
		for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
			const template = document.createElement('template');
			template.innerHTML = await read(`demo/${name}`);
			for (const host of template.content.querySelectorAll(
				'form-required-if',
			)) {
				const field = host.querySelector('input, select, textarea');
				const description = host.querySelector('.required-message');
				expect(description, name).not.toBeNull();
				expect(field.getAttribute('aria-describedby'), name).toBe(
					description.id,
				);
				// Referenced hidden descriptions still contribute to the accessible
				// description before a field becomes required.
				expect(description.textContent, name).toMatch(/Required when/);
			}
		}
	});
});

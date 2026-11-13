import { test, expect } from '@playwright/test';
import { measurements } from './palettes.js';

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	for (const mode of ['light', 'dark', 'forced colors']) {
		test(`${name}: ${mode} semantic code highlights retain contrast and reflow`, async ({
			page,
			browserName,
		}) => {
			test.skip(
				mode === 'forced colors' && browserName === 'webkit',
				'Bundled WebKit does not emulate forced colors.',
			);
			await page.route('https://esm.sh/**', (route) => route.abort());
			await page.route('https://unpkg.com/**', (route) => route.abort());
			await page.emulateMedia({
				colorScheme: mode === 'dark' ? 'dark' : 'light',
				forcedColors: mode === 'forced colors' ? 'active' : 'none',
			});
			await page.goto(`/demo/${name}`);
			const codes = page.locator('pre code');
			const text = await codes.allTextContents();
			const marks = page.locator('pre code mark');
			await expect(marks).toHaveCount(name === 'index.html' ? 28 : 2);
			await expect(page.locator('pre code mark mark')).toHaveCount(0);
			for (const mark of await marks.all())
				expect((await measurements(mark)).text).toBeGreaterThanOrEqual(
					4.5,
				);
			await page.setViewportSize({ width: 320, height: 800 });
			await page.addStyleTag({ content: ':root { font-size: 200%; }' });
			expect(
				await page.evaluate(
					() =>
						document.documentElement.scrollWidth <=
						window.innerWidth,
				),
			).toBe(true);
			for (const code of await page.locator('pre').all()) {
				const bounds = await code.boundingBox();
				expect(bounds.x).toBeGreaterThanOrEqual(0);
				expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
			}
			expect(await codes.allTextContents()).toEqual(text);
		});
	}
}

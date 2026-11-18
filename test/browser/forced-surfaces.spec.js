import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { substitute } from './palettes.js';

test('forced-color rules restore solid field/button backplates without gradients', async ({
	page,
}) => {
	await page.route(
		'https://cdn.jsdelivr.net/npm/microlighter@2.2.0/dist/**',
		(route) => route.abort(),
	);
	await page.goto('/demo/index.html');
	const css = (
		await Promise.all(
			['styles.css', 'demo-shell.css'].map((file) =>
				readFile(
					new URL(`../../demo/${file}`, import.meta.url),
					'utf8',
				),
			),
		)
	).join('\n');
	await page
		.locator('link[rel="stylesheet"]')
		.evaluateAll((links) => links.forEach((link) => link.remove()));
	await page.locator('main').evaluate((main) => {
		const log = document.createElement('pre');
		log.className = 'event-log';
		log.textContent = 'Event output';
		main.append(log);
	});
	const forced = await page.evaluate((css) => {
		const style = document.createElement('style');
		style.textContent = css;
		document.head.append(style);
		const rules = [...style.sheet.cssRules]
			.filter((rule) =>
				rule.conditionText?.includes('forced-colors: active'),
			)
			.flatMap((rule) => [...rule.cssRules].map((rule) => rule.cssText));
		style.remove();
		return rules.join('\n');
	}, css);
	// Apply the forced-color cascade without UA repainting so distinct test
	// colors expose a Canvas backplate behind FieldText or ButtonText.
	const palette = [
		'#101010',
		'#eeeeee',
		'#203040',
		'#fafafa',
		'#e0e0e0',
		'#121212',
	];
	await page.addStyleTag({
		content: substitute(`${css}\n${forced}`, palette),
	});
	for (const selector of [
		'pre',
		'.event-log',
		'#phone',
		'#feature-type',
		'#config',
		'.demo-section > p code',
		'button[type="submit"]',
		'button[type="reset"]',
	]) {
		const element = page.locator(selector).first();
		const buttonPair =
			selector.includes('button') || selector.includes('code');
		for (const hover of [false, true]) {
			if (hover) await element.hover();
			expect(
				await element.evaluate((element) => {
					const style = getComputedStyle(element);
					return [
						style.backgroundColor,
						style.backgroundImage,
						style.color,
					];
				}),
				selector,
			).toEqual(
				buttonPair
					? ['rgb(32, 48, 64)', 'none', 'rgb(250, 250, 250)']
					: ['rgb(224, 224, 224)', 'none', 'rgb(18, 18, 18)'],
			);
		}
	}
});

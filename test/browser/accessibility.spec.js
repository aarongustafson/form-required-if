import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { measurements, palettes, substitute } from './palettes.js';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const source = await read('form-required-if.js');
const definition = await read('define.js');

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definition.replace(
				"'./form-required-if.js'",
				"'http://127.0.0.1:4191/form-required-if.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect
		.poll(() =>
			page.evaluate(() =>
				Boolean(customElements.get('form-required-if')),
			),
		)
		.toBe(true);
}

test('existing hints describe fields without repeating in accessible names', async ({
	page,
}) => {
	await demo(page);
	for (const [id, name] of [
		['phone', 'Phone number'],
		['details', 'Details'],
		['secret', 'Secret code'],
		['company', 'Company'],
		['department', 'Department'],
		['feature-type', 'Feature type'],
		['config', 'Advanced configuration'],
	]) {
		const field = page.locator(`#${id}`);
		const descriptionId = await field.getAttribute('aria-describedby');
		const hint = page.locator(`#${descriptionId}`);
		await expect(hint).toBeVisible();
		await expect(field).toHaveAccessibleName(name);
		await expect(field).toHaveAccessibleDescription(
			(await hint.textContent()).trim().replace(/\s+/g, ' '),
		);
	}
	await expect(page.locator('.required-message')).toHaveCount(0);
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: required instructions, native validation, reset, and focus`, async ({
		page,
	}) => {
		await demo(page, name);
		const form = page.locator('form').first();
		const trigger = form.locator('input, select').first();
		const field = form.locator('form-required-if input').first();
		await expect(field).not.toHaveAttribute('required', '');
		if (name === 'index.html') await trigger.fill('reader@example.com');
		else await trigger.selectOption('email');
		await expect(field).toHaveAttribute('required', '');
		await expect(field).toHaveAttribute('aria-required', 'true');
		if (name === 'index.html') {
			await expect(form.locator('#phone-required')).toBeVisible();
			await expect(field).toHaveAccessibleName('Phone number*');
			await expect(field).toHaveAccessibleDescription(
				'This field becomes required if the email field is filled out',
			);
		} else {
			await expect(field).not.toHaveAttribute('aria-describedby');
			await expect(field).toHaveAccessibleName(
				/Email \(required when email selected\)/,
			);
		}
		await field.focus();
		expect(
			await field.evaluate((field) => {
				const style = getComputedStyle(field);
				return (
					style.outlineStyle !== 'none' &&
					style.outlineWidth !== '0px'
				);
			}),
		).toBe(true);
		expect(
			await field.evaluate((field) => field.form.reportValidity()),
		).toBe(false);
		await expect(field).toBeFocused();
		expect(
			await field.evaluate((field) => field.validationMessage.length),
		).toBeGreaterThan(0);
		await field.fill(
			name === 'index.html' ? '1234567' : 'reader@example.com',
		);
		expect(await field.evaluate((field) => field.checkValidity())).toBe(
			true,
		);
		await form.evaluate((form) => form.reset());
		await expect(field).not.toHaveAttribute('required', '');
		if (name === 'index.html') {
			await expect(form.locator('#phone-required')).toBeVisible();
			await expect(field).toHaveAccessibleDescription(
				'This field becomes required if the email field is filled out',
			);
		}
	});

	test(`${name}: narrow and enlarged text reflow, paired layout, and recovery`, async ({
		page,
	}) => {
		await demo(page, name);
		await page.setViewportSize({ width: 1280, height: 900 });
		const pair = page.locator('.code-demo-pair').first();
		const code = await pair.locator('pre').boundingBox();
		const live = await pair.locator('.demo').boundingBox();
		expect(code.x + code.width).toBeLessThanOrEqual(live.x);
		await page.setViewportSize({ width: 320, height: 800 });
		await page.addStyleTag({ content: ':root { font-size: 200%; }' });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		const narrowCode = await pair.locator('pre').boundingBox();
		const narrowLive = await pair.locator('.demo').boundingBox();
		expect(narrowCode.y + narrowCode.height).toBeLessThanOrEqual(
			narrowLive.y,
		);
		await expect(page.locator('footer')).toContainText('Aaron Gustafson');
		await expect(page.locator('.enhancement-note')).toBeVisible();
	});

	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: ${failure} leaves fields and recovery instructions usable`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
			});
			const page = await context.newPage();
			if (failure === 'module failure')
				await page.route(
					/\.js(?:\?|$)|https:\/\/(?:esm\.sh|unpkg\.com)/,
					(route) => route.abort(),
				);
			await page.goto(`/demo/${name}`);
			await expect(page.locator('.enhancement-note')).toBeVisible();
			for (const field of await page
				.locator('form-required-if input')
				.all()) {
				await expect(field).toBeVisible();
				await field.fill('Retained details');
				await expect(field).toHaveValue('Retained details');
			}
			await context.close();
		});
	}
}

test('baseline keeps native focus, supporting text, and reading surfaces', async () => {
	const css = await read('demo/styles.css');
	expect(css).not.toMatch(
		/GrayText|ActiveText|SelectedItem|Highlight|AccentColor/,
	);
	expect(css).not.toMatch(/:focus-visible|opacity:\s*0\./);
	expect(css).toMatch(/background(?:-color)?:\s*Canvas/);
});

test('all 19 study palettes retain reading, required-theme, field, and button contrast', async ({
	page,
}) => {
	await demo(page);
	const css = await read('demo/styles.css');
	const style = await page.addStyleTag({ content: css });
	await page.locator('input[name="email"]').fill('reader@example.com');
	await expect(page.locator('#phone')).toHaveAttribute('required', '');
	for (const palette of palettes) {
		await style.evaluate(
			(style, css) => {
				style.textContent = css;
			},
			substitute(css, palette),
		);
		for (const selector of [
			'body',
			'.note',
			'.demo-section',
			'.demo',
			'pre',
			'code',
			'.api-reference',
			'footer',
			'#phone-required',
			'label[for="phone"]',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				`${palette[0]} ${selector}`,
			).toBeGreaterThanOrEqual(4.5);
		}
		for (const selector of [
			'#phone',
			'#contact-email',
			'#feature-type',
			'#config',
		]) {
			const result = await measurements(page.locator(selector));
			expect(result.text, selector).toBeGreaterThanOrEqual(4.5);
			expect(result.boundary, selector).toBeGreaterThanOrEqual(3);
		}
		for (const button of await page.locator('button').all()) {
			for (const hover of [false, true]) {
				if (hover) await button.hover();
				const result = await measurements(button);
				expect(result.text).toBeGreaterThanOrEqual(4.5);
				expect(result.boundary).toBeGreaterThanOrEqual(3);
			}
		}
	}
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: actual reading surfaces and required theme contrast`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await demo(page);
		await page.locator('input[name="email"]').fill('reader@example.com');
		for (const selector of [
			'body',
			'.note',
			'pre',
			'pre mark',
			'.api-reference',
			'footer',
			'#phone-required',
			'label[for="phone"]',
			'#phone',
			'a',
			'small',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				selector,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
	test(`${colorScheme}: actual native button pair and hover contrast`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			process.platform === 'linux' &&
				browserName === 'webkit' &&
				colorScheme === 'dark',
			'Known Ubuntu WebKit ButtonText/ButtonFace native pair limitation.',
		);
		await page.emulateMedia({ colorScheme });
		await demo(page);
		expect(
			(await measurements(page.locator('code').first())).text,
		).toBeGreaterThanOrEqual(4.5);
		for (const button of await page.locator('button').all()) {
			for (const hover of [false, true]) {
				if (hover) await button.hover();
				expect(
					(await measurements(button)).text,
				).toBeGreaterThanOrEqual(4.5);
			}
		}
	});
}

test('keyboard radio/checkbox dependencies preserve values and native navigation', async ({
	page,
}) => {
	await demo(page);
	const radio = page.locator('input[name="radio"][value="other"]');
	await radio.focus();
	await page.keyboard.press('Space');
	const other = page.locator('input[name="radio-other"]');
	await expect(other).toHaveAttribute('required', '');
	await expect(radio).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(other).toBeFocused();
	await other.fill('A different choice');
	await radio.focus();
	await page.keyboard.press('ArrowUp');
	await expect(other).toBeHidden();
	await expect(page.locator('input[name="radio"][value="2"]')).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(other).toHaveValue('A different choice');
	const checkbox = page.locator('input[name="checkbox[]"][value="other"]');
	await checkbox.focus();
	await page.keyboard.press('Space');
	await expect(page.locator('input[name="checkbox-other"]')).toHaveAttribute(
		'required',
		'',
	);
	await expect(checkbox).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(page.locator('input[name="checkbox-other"]')).toBeFocused();
});

test('increased contrast and supported forced-color emulation retain native focus and state', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName === 'webkit',
		'Bundled WebKit does not emulate forced colors.',
	);
	await page.emulateMedia({ forcedColors: 'active', contrast: 'more' });
	await demo(page);
	const trigger = page.locator('input[name="email"]');
	await trigger.fill('reader@example.com');
	await page.keyboard.press('Tab');
	const field = page.locator('#phone');
	await expect(field).toBeFocused();
	await expect(page.locator('#phone-required')).toBeVisible();
	const styles = await field.evaluate((field) => {
		const style = getComputedStyle(field);
		return {
			adjustment: style.forcedColorAdjust,
			outline: style.outlineStyle,
		};
	});
	expect(styles.adjustment).toBe('auto');
	expect(styles.outline).not.toBe('none');
	for (const selector of [
		'pre',
		'#phone',
		'#feature-type',
		'#config',
		'.demo-section > p code',
		'button[type="submit"]',
		'button[type="reset"]',
	]) {
		expect(
			await page
				.locator(selector)
				.first()
				.evaluate((element) => {
					const style = getComputedStyle(element);
					return [style.backgroundImage, style.forcedColorAdjust];
				}),
			selector,
		).toEqual(['none', 'auto']);
	}
	expect(
		(await measurements(page.locator('#phone-required'))).text,
	).toBeGreaterThanOrEqual(4.5);
});

test('preview serves no-cache demos without exposing repository metadata', async ({
	request,
}) => {
	const response = await request.get('/demo/index.html');
	expect(response.status()).toBe(200);
	expect(response.headers()['cache-control']).toBe('no-store');
	for (const path of [
		'/.git/config',
		'/package-lock.json',
		'/node_modules/vitest/package.json',
	]) {
		expect((await request.get(path)).status(), path).toBe(403);
	}
});

test('contact form keyboard submission focuses the invalid field without losing entered data', async ({
	page,
}) => {
	await demo(page);
	const form = page.locator('form').last();
	await form.locator('input[name="name"]').fill('A reader');
	await form.locator('input[value="email"]').check();
	const field = form.locator('#contact-email');
	await expect(field).toHaveAttribute('required', '');
	await form.locator('#message').fill('Please contact me.');
	await form
		.getByRole('button', { name: 'Check details', exact: true })
		.focus();
	await page.keyboard.press('Enter');
	await expect(field).toBeFocused();
	await expect(form.locator('input[name="name"]')).toHaveValue('A reader');
	await expect(form.locator('#message')).toHaveValue('Please contact me.');
	await expect(field).toHaveAccessibleName('Email address');
	await expect(field).not.toHaveAttribute('aria-describedby');
	await form.getByRole('button', { name: 'Reset', exact: true }).click();
	await expect(field).not.toHaveAttribute('required', '');
	await expect(form.locator('input[name="name"]')).toHaveValue('');
});

test('disconnect and reconnect keep one authored indicator without duplicate updates', async ({
	page,
}) => {
	await demo(page);
	const trigger = page.locator('input[name="email"]');
	const host = page.locator('form-required-if:has(#phone)');
	await trigger.fill('reader@example.com');
	await expect(host.locator('input')).toHaveAttribute('required', '');
	await host.evaluate((host) => {
		window.detachedRequiredIf = host;
		host.remove();
	});
	await trigger.fill('another@example.com');
	await expect(page.locator('#phone')).toHaveCount(0);
	await trigger.evaluate((trigger) => {
		trigger.closest('form').append(window.detachedRequiredIf);
		delete window.detachedRequiredIf;
	});
	await expect(host.locator('label > span')).toHaveCount(1);
	await expect(host.locator('input')).toHaveAttribute('required', '');
	for (const value of ['', 'reader@example.com', '']) {
		await trigger.fill(value);
		await expect(host.locator('input')).toHaveJSProperty(
			'required',
			Boolean(value),
		);
	}
	await expect(host.locator('label > span')).toHaveCount(1);
});

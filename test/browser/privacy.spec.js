import { readFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { test, expect } from '@playwright/test';

const source = await readFile(
	new URL('../../form-required-if.js', import.meta.url),
	'utf8',
);
const definition = await readFile(
	new URL('../../define.js', import.meta.url),
	'utf8',
);

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	for (const mode of [
		'enhanced',
		'no JavaScript',
		'helper failure',
		'component failure',
	]) {
		test(`${name}: ${mode} validates without navigation or data requests`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				baseURL: 'http://127.0.0.1:4191',
				javaScriptEnabled: mode !== 'no JavaScript',
			});
			try {
				const page = await context.newPage();
				await page.route('https://esm.sh/**', (route) =>
					route.fulfill({
						contentType: 'text/javascript',
						body: source,
					}),
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
				if (mode === 'component failure') {
					await page.route('**/form-required-if.js', (route) =>
						route.abort(),
					);
					if (name === 'esm.html')
						await page.route('https://esm.sh/**', (route) =>
							route.abort(),
						);
				}
				if (mode === 'helper failure') {
					await page.route('**/define.js', (route) => route.abort());
					await page.route('https://unpkg.com/**', (route) =>
						route.abort(),
					);
					if (name === 'esm.html') {
						await page.route('**/demo/esm.html', async (route) => {
							const response = await route.fetch();
							const body = await response.text();
							expect(body).toContain('if (!customElements.get(');
							await route.fulfill({
								response,
								body: body.replace(
									'if (!customElements.get(',
									"throw new Error('Simulated registration failure'); if (!customElements.get(",
								),
							});
						});
					}
				}
				await page.goto(`/demo/${name}`);
				if (mode === 'enhanced')
					await expect
						.poll(() =>
							page.evaluate(() =>
								Boolean(customElements.get('form-required-if')),
							),
						)
						.toBe(true);
				else
					expect(
						await page.evaluate(() =>
							Boolean(customElements.get('form-required-if')),
						),
					).toBe(false);

				const form = page.locator('form').last();
				const email = form.locator('input[type="email"]');
				const marker = 'privacy-proof';
				if (name === 'index.html') {
					await form.locator('input[name="name"]').fill(marker);
					await form.locator('input[value="email"]').check();
					await form.locator('textarea').fill(`${marker} message`);
				} else {
					await form.locator('select').selectOption('email');
				}
				const requests = [];
				const navigations = [];
				page.on('request', (request) => {
					if (
						request.isNavigationRequest() ||
						request.url().includes(marker) ||
						request.postData()?.includes(marker)
					)
						requests.push({
							url: request.url(),
							body: request.postData(),
						});
				});
				page.on('framenavigated', (frame) => {
					if (frame === page.mainFrame())
						navigations.push(frame.url());
				});
				const url = page.url();
				const submit = form.locator('button[type="submit"]');
				await email.fill('not-an-email');
				await submit.click();
				await expect(email).toBeFocused();
				expect(
					await email.evaluate(
						(field) => field.validity.typeMismatch,
					),
				).toBe(true);
				expect(
					await email.evaluate(
						(field) => field.validationMessage.length,
					),
				).toBeGreaterThan(0);

				await email.fill(`${marker}@example.com`);
				expect(
					await form.evaluate((form) => form.checkValidity()),
				).toBe(true);
				const values = await form.evaluate((form) => [
					...new FormData(form).entries(),
				]);
				await submit.click();
				await page.waitForTimeout(150);
				expect(requests).toEqual([]);
				expect(navigations).toEqual([]);
				expect(page.url()).toBe(url);
				await email.press('Enter');
				await page.waitForTimeout(150);
				expect(requests).toEqual([]);
				expect(navigations).toEqual([]);
				expect(page.url()).toBe(url);
				expect(
					await form.evaluate((form) => [
						...new FormData(form).entries(),
					]),
				).toEqual(values);
			} finally {
				await context.close();
			}
		});
	}
}

test('malformed scheme-relative request returns 400 and the next request still succeeds', async ({
	request,
}) => {
	const status = await new Promise((resolve, reject) => {
		const malformed = httpRequest(
			{ hostname: '127.0.0.1', port: 4191, path: '//[' },
			(response) => {
				response.resume();
				response.on('end', () => resolve(response.statusCode));
			},
		);
		malformed.on('error', reject);
		malformed.end();
	});
	expect(status).toBe(400);
	expect((await request.get('/demo/index.html')).status()).toBe(200);
});

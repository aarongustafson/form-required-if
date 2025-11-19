import { beforeAll } from 'vitest';
import { FormRequiredIfElement } from '../form-required-if.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('form-required-if')) {
		customElements.define('form-required-if', FormRequiredIfElement);
	}
});

import { FormRequiredIfElement } from './form-required-if.js';

export function defineFormRequiredIf(tagName = 'form-required-if') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, FormRequiredIfElement);
	}

	return true;
}

defineFormRequiredIf();

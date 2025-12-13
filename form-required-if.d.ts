export class FormRequiredIfElement extends HTMLElement {
	conditions: string | null;
	indicator: string | null;
	indicatorPosition: string | null;
}

declare global {
	interface HTMLElementTagNameMap {
		'form-required-if': FormRequiredIfElement;
	}
}

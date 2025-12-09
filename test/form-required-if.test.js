import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, getByRole, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

describe('FormRequiredIfElement', () => {
	let container;
	let user;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		user = userEvent.setup();
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	const createForm = (formHTML) => {
		container.innerHTML = `<form>${formHTML}</form>`;
		return container.querySelector('form');
	};

	describe('Basic functionality', () => {
		it('should define the custom element', () => {
			expect(customElements.get('form-required-if')).toBeDefined();
		});

		it('should render without errors', () => {
			const form = createForm(`
				<form-required-if conditions="email=*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			expect(form.querySelector('form-required-if')).toBeTruthy();
		});

		it('should find and store references to form elements', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<form-required-if conditions="email=*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const component = form.querySelector('form-required-if');
			const testField = form.querySelector('[name="test"]');

			// Wait for component initialization
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(component.__$field).toBe(testField);
			expect(component.__$form).toBe(form);
		});
	});

	describe('Required state management', () => {
		it('should make field required when condition is met', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<form-required-if conditions="email=*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const emailField = form.querySelector('[name="email"]');
			const testField = form.querySelector('[name="test"]');

			// Initially should not be required
			expect(testField.required).toBe(false);

			// Add value to email field to trigger condition
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			// Wait for the component to process the change
			await waitFor(() => {
				expect(testField.required).toBe(true);
			});
		});

		it('should make field optional when condition is not met', async () => {
			const form = createForm(`
				<input type="email" name="email" value="test@example.com">
				<form-required-if conditions="email=*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const emailField = form.querySelector('[name="email"]');
			const testField = form.querySelector('[name="test"]');

			// Wait for initial processing
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should be required initially (email has value)
			await waitFor(() => {
				expect(testField.required).toBe(true);
			});

			// Clear email field
			await user.clear(emailField);
			fireEvent.change(emailField);

			// Should become optional
			await waitFor(() => {
				expect(testField.required).toBe(false);
			});
		});

		it('should handle multiple conditions with OR logic', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<input type="text" name="phone" value="">
				<form-required-if conditions="email=*||phone=*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const emailField = form.querySelector('[name="email"]');
			const phoneField = form.querySelector('[name="phone"]');
			const testField = form.querySelector('[name="test"]');

			// Initially should not be required
			expect(testField.required).toBe(false);

			// Add value to email field
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			await waitFor(() => {
				expect(testField.required).toBe(true);
			});

			// Clear email, add phone
			await user.clear(emailField);
			await user.type(phoneField, '555-1234');
			fireEvent.change(emailField);
			fireEvent.change(phoneField);

			await waitFor(() => {
				expect(testField.required).toBe(true);
			});
		});

		it('should handle specific value conditions', async () => {
			const form = createForm(`
				<select name="country">
					<option value="">Select country</option>
					<option value="US">United States</option>
					<option value="CA">Canada</option>
				</select>
				<form-required-if conditions="country=US">
					<label for="state">State (required for US)</label>
					<input type="text" id="state" name="state">
				</form-required-if>
			`);

			const countryField = form.querySelector('[name="country"]');
			const stateField = form.querySelector('[name="state"]');

			// Initially should not be required
			expect(stateField.required).toBe(false);

			// Select US
			await user.selectOptions(countryField, 'US');
			fireEvent.change(countryField);

			await waitFor(() => {
				expect(stateField.required).toBe(true);
			});

			// Select Canada
			await user.selectOptions(countryField, 'CA');
			fireEvent.change(countryField);

			await waitFor(() => {
				expect(stateField.required).toBe(false);
			});
		});
	});

	describe('Checkbox handling', () => {
		it('should handle checkbox conditions correctly', async () => {
			const form = createForm(`
				<fieldset>
					<legend>Interests</legend>
					<label><input type="checkbox" name="interests" value="sports"> Sports</label>
					<label><input type="checkbox" name="interests" value="music"> Music</label>
				</fieldset>
				<form-required-if conditions="interests=sports">
					<label for="team">Favorite team</label>
					<input type="text" id="team" name="team">
				</form-required-if>
			`);

			const sportsCheckbox = form.querySelector(
				'[name="interests"][value="sports"]',
			);
			const teamField = form.querySelector('[name="team"]');

			// Initially should not be required
			expect(teamField.required).toBe(false);

			// Check sports
			await user.click(sportsCheckbox);
			fireEvent.change(sportsCheckbox);

			await waitFor(() => {
				expect(teamField.required).toBe(true);
			});

			// Uncheck sports
			await user.click(sportsCheckbox);
			fireEvent.change(sportsCheckbox);

			await waitFor(() => {
				expect(teamField.required).toBe(false);
			});
		});
	});

	describe('Visual indicator', () => {
		it('should add and remove text indicator', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<form-required-if conditions="email=*" indicator="*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const emailField = form.querySelector('[name="email"]');
			const label = form.querySelector('label');

			// Add value to trigger condition
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			// Wait for indicator to appear
			await waitFor(() => {
				expect(label.textContent).toContain('*');
			});

			// Clear email to remove condition
			await user.clear(emailField);
			fireEvent.change(emailField);

			// Indicator should be hidden
			await waitFor(() => {
				const indicator = label.querySelector('[hidden]');
				expect(indicator).toBeTruthy();
			});
		});

		it('should add HTML indicator', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<form-required-if conditions="email=*" indicator="<span class='required'>*</span>">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const emailField = form.querySelector('[name="email"]');
			const label = form.querySelector('label');

			// Add value to trigger condition
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			// Wait for HTML indicator to appear
			await waitFor(() => {
				const indicator = label.querySelector('.required');
				expect(indicator).toBeTruthy();
				expect(indicator.textContent).toBe('*');
			});
		});

		it('should position indicator before when specified', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<form-required-if conditions="email=*" indicator="*" indicator-position="before">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
			`);

			const emailField = form.querySelector('[name="email"]');
			const label = form.querySelector('label');

			// Add value to trigger condition
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			// Wait for indicator positioning
			await waitFor(() => {
				const firstChild = label.firstElementChild;
				expect(firstChild?.tagName).toBe('SPAN');
				expect(firstChild?.textContent).toBe('*');
			});
		});
	});

	describe('Form reset handling', () => {
		it('should re-evaluate conditions on form reset', async () => {
			const form = createForm(`
				<input type="email" name="email" value="">
				<form-required-if conditions="email=*">
					<label for="test">Test field</label>
					<input type="text" id="test" name="test">
				</form-required-if>
				<button type="reset">Reset</button>
			`);

			const emailField = form.querySelector('[name="email"]');
			const testField = form.querySelector('[name="test"]');
			const resetButton = form.querySelector('[type="reset"]');

			// Add value to make field required
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			await waitFor(() => {
				expect(testField.required).toBe(true);
			});

			// Reset form
			await user.click(resetButton);

			// Field should become optional after reset
			await waitFor(() => {
				expect(testField.required).toBe(false);
			});
		});
	});

	describe('Static utility methods', () => {
		it('should get current value for regular input', () => {
			const input = document.createElement('input');
			input.value = 'test value';

			const result = FormRequiredIfElement.__getCurrentValue(input);
			expect(result).toBe('test value');
		});

		it('should get current values for checkboxes', () => {
			const form = createForm(`
				<input type="checkbox" name="test" value="a" checked>
				<input type="checkbox" name="test" value="b">
				<input type="checkbox" name="test" value="c" checked>
			`);

			const checkboxes = form.querySelectorAll('[name="test"]');
			const result = FormRequiredIfElement.__getCurrentValue(checkboxes);

			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(['a', 'c']);
		});

		it('should get current value for single checkbox when checked', () => {
			const form = createForm(`
				<input type="checkbox" name="test" value="yes">
			`);

			const checkbox = form.querySelector('[name="test"]');

			// Unchecked
			expect(FormRequiredIfElement.__getCurrentValue(checkbox)).toBe('');

			// Checked
			checkbox.checked = true;
			expect(FormRequiredIfElement.__getCurrentValue(checkbox)).toBe(
				'yes',
			);
		});

		it('should get current value for single checkbox with default "on" value', () => {
			const form = createForm(`
				<input type="checkbox" name="test">
			`);

			const checkbox = form.querySelector('[name="test"]');

			// Unchecked
			expect(FormRequiredIfElement.__getCurrentValue(checkbox)).toBe('');

			// Checked (browsers default to "on")
			checkbox.checked = true;
			expect(FormRequiredIfElement.__getCurrentValue(checkbox)).toBe(
				'on',
			);
		});

		it('should match values correctly', () => {
			const { __valuesMatch } = FormRequiredIfElement;

			// Exact match
			expect(__valuesMatch('test', 'test')).toBe(true);
			expect(__valuesMatch('test', 'other')).toBe(false);

			// Wildcard match
			expect(__valuesMatch('*', 'anything')).toBe(true);
			expect(__valuesMatch('*', '')).toBe(false);

			// Array match (checkboxes)
			expect(__valuesMatch('value1', ['value1', 'value2'])).toBe(true);
			expect(__valuesMatch('value3', ['value1', 'value2'])).toBe(false);
		});
	});

	describe('Checkbox handling', () => {
		it('should not make field required when single checkbox is unchecked', async () => {
			const form = createForm(`
				<input type="checkbox" name="enable" value="yes">
				<form-required-if conditions="enable=yes">
					<label for="dependent">Dependent field</label>
					<input type="text" id="dependent" name="dependent">
				</form-required-if>
			`);

			await waitFor(() => {
				const dependentField = form.querySelector('[name="dependent"]');
				expect(dependentField.required).toBe(false);
			});
		});

		it('should make field required when single checkbox is checked', async () => {
			const form = createForm(`
				<input type="checkbox" name="enable" value="yes">
				<form-required-if conditions="enable=yes">
					<label for="dependent">Dependent field</label>
					<input type="text" id="dependent" name="dependent">
				</form-required-if>
			`);

			const checkbox = form.querySelector('[name="enable"]');
			const dependentField = form.querySelector('[name="dependent"]');

			await user.click(checkbox);

			await waitFor(() => {
				expect(dependentField.required).toBe(true);
			});
		});

		it('should make field optional when single checkbox is unchecked after being checked', async () => {
			const form = createForm(`
				<input type="checkbox" name="enable" value="yes">
				<form-required-if conditions="enable=yes">
					<label for="dependent">Dependent field</label>
					<input type="text" id="dependent" name="dependent">
				</form-required-if>
			`);

			const checkbox = form.querySelector('[name="enable"]');
			const dependentField = form.querySelector('[name="dependent"]');

			// Check the checkbox
			await user.click(checkbox);
			await waitFor(() => {
				expect(dependentField.required).toBe(true);
			});

			// Uncheck the checkbox
			await user.click(checkbox);
			await waitFor(() => {
				expect(dependentField.required).toBe(false);
			});
		});

		it('should handle single checkbox with default "on" value', async () => {
			const form = createForm(`
				<input type="checkbox" name="enable">
				<form-required-if conditions="enable=on">
					<label for="dependent">Dependent field</label>
					<input type="text" id="dependent" name="dependent">
				</form-required-if>
			`);

			const checkbox = form.querySelector('[name="enable"]');
			const dependentField = form.querySelector('[name="dependent"]');

			// Initially unchecked
			await waitFor(() => {
				expect(dependentField.required).toBe(false);
			});

			// Check the checkbox
			await user.click(checkbox);
			await waitFor(() => {
				expect(dependentField.required).toBe(true);
			});
		});
	});

	describe('Fallback to document.body', () => {
		it('should work without a form wrapper by falling back to document.body', async () => {
			// Create elements without a form wrapper
			container.innerHTML = `
				<input type="email" name="email-no-form" value="">
				<form-required-if conditions="email-no-form=*">
					<label for="test-no-form">Test field</label>
					<input type="text" id="test-no-form" name="test-no-form">
				</form-required-if>
			`;

			const component = container.querySelector('form-required-if');
			const emailField = container.querySelector(
				'[name="email-no-form"]',
			);
			const testField = container.querySelector('[name="test-no-form"]');

			// Wait for component initialization
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should fall back to document.body when no form is found
			expect(component.__$form).toBe(document.body);

			// Initially should not be required
			expect(testField.required).toBe(false);

			// Add value to email field to trigger condition
			await user.type(emailField, 'test@example.com');
			fireEvent.change(emailField);

			// Wait for the component to process the change
			await waitFor(() => {
				expect(testField.required).toBe(true);
			});

			// Clear email field
			await user.clear(emailField);
			fireEvent.change(emailField);

			// Should become optional again
			await waitFor(() => {
				expect(testField.required).toBe(false);
			});
		});

		it('should handle field lookup without form.elements', async () => {
			// Create elements without a form wrapper
			container.innerHTML = `
				<select name="contact-method-no-form">
					<option value="">Select one</option>
					<option value="email">Email</option>
					<option value="phone">Phone</option>
				</select>
				<form-required-if conditions="contact-method-no-form=email">
					<label for="email-no-form">Email Address</label>
					<input type="email" id="email-no-form" name="email-no-form">
				</form-required-if>
			`;

			const component = container.querySelector('form-required-if');
			const selectField = container.querySelector(
				'[name="contact-method-no-form"]',
			);
			const emailField = container.querySelector(
				'[name="email-no-form"]',
			);

			// Wait for component initialization
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Should fall back to document.body
			expect(component.__$form).toBe(document.body);

			// Initially should not be required
			expect(emailField.required).toBe(false);

			// Select email option
			await user.selectOptions(selectField, 'email');
			fireEvent.change(selectField);

			// Should become required
			await waitFor(() => {
				expect(emailField.required).toBe(true);
			});

			// Select phone option
			await user.selectOptions(selectField, 'phone');
			fireEvent.change(selectField);

			// Should become optional again
			await waitFor(() => {
				expect(emailField.required).toBe(false);
			});
		});
	});
});

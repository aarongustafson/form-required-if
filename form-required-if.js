export class FormRequiredIfElement extends HTMLElement {
	connectedCallback() {
		// Use requestAnimationFrame for better performance than setTimeout
		requestAnimationFrame(() => {
			this.__$field = this.querySelector(
				'input:not([type=submit],[type=image],[type=button]),select,textarea',
			);
			this.__$form = this.closest('form');
			this.__is_required = false;

			// Cache parsed conditions instead of splitting on every check
			const conditionsAttr = this.getAttribute('conditions');
			this.__conditions = conditionsAttr
				? conditionsAttr.split('||').map((condition) => {
						const [name, value] = condition.split('=');
						return { name: name.trim(), value: value.trim() };
					})
				: [];
			this.__$fields = {};

			// Cache attributes
			this.__indicator = this.getAttribute('indicator');
			this.__indicator_position =
				this.getAttribute('indicator-position') || 'after';
			this.__$indicator = null;
			this.__$indicator_placeholder = null;

			// Bind methods once for reuse
			this.__boundCheckIfRequired = this.__checkIfRequired.bind(this);
			this.__boundResetHandler = this.__handleReset.bind(this);

			this.__init();
		});
	}

	__addObservers() {
		this.__$form.addEventListener('reset', this.__boundResetHandler, false);
		this.__$form.addEventListener(
			'change',
			this.__boundCheckIfRequired,
			false,
		);
		this.__$form.addEventListener(
			'input',
			this.__boundCheckIfRequired,
			false,
		);
	}

	__handleReset() {
		// Use requestAnimationFrame instead of setTimeout for better performance
		requestAnimationFrame(this.__boundCheckIfRequired);
	}

	disconnectedCallback() {
		// Clean up event listeners when component is removed
		if (this.__$form) {
			this.__$form.removeEventListener(
				'reset',
				this.__boundResetHandler,
				false,
			);
			this.__$form.removeEventListener(
				'change',
				this.__boundCheckIfRequired,
				false,
			);
			this.__$form.removeEventListener(
				'input',
				this.__boundCheckIfRequired,
				false,
			);
		}
	}

	__toggleIndicator() {
		if (!this.__$indicator) {
			return;
		}
		if (this.__$indicator.hidden) {
			this.__$indicator.hidden = false;
			this.__$indicator.removeAttribute('aria-hidden');
		} else {
			this.__$indicator.hidden = true;
			this.__$indicator.setAttribute('aria-hidden', 'true');
		}
	}

	__prepareIndicator() {
		if (!this.__indicator) {
			return;
		}

		const $label = this.querySelector('label');
		const [$label_start, $label_end] =
			FormRequiredIfElement.__getLabelBoundaries($label);
		FormRequiredIfElement.__trimTextNodes($label);

		// Check if indicator is HTML (starts with '<')
		if (this.__indicator.charCodeAt(0) !== 60) {
			// 60 is '<'
			this.__$indicator = document.createElement('span');
			this.__$indicator.innerHTML = this.__indicator;
		} else {
			const $template = document.createElement('template');
			$template.innerHTML = this.__indicator;
			this.__$indicator = $template.content.firstElementChild;
		}

		this.__toggleIndicator();

		if (this.__indicator_position === 'after') {
			if ($label_end.nextSibling) {
				$label.insertBefore(this.__$indicator, $label_end.nextSibling);
			} else {
				$label.appendChild(this.__$indicator);
			}
		} else {
			$label.insertBefore(this.__$indicator, $label_start);
		}
	}

	__makeFieldRequired() {
		this.__$field.required = true;
		this.__$field.setAttribute('aria-required', 'true');
		this.__toggleIndicator();
		this.__is_required = true;
	}

	__makeFieldOptional() {
		this.__$field.required = false;
		this.__$field.removeAttribute('aria-required');
		this.__toggleIndicator();
		this.__is_required = false;
	}

	__checkIfRequired() {
		let should_be_required = false;

		// Use for loop instead of forEach for better performance
		// Can break early when condition is met
		for (let i = 0; i < this.__conditions.length; i++) {
			const { name, value } = this.__conditions[i];

			const $field = this.__$form.elements[name];
			if (!$field) {
				continue;
			}

			const current_value =
				FormRequiredIfElement.__getCurrentValue($field);
			if (FormRequiredIfElement.__valuesMatch(value, current_value)) {
				should_be_required = true;
				break; // Early exit - OR logic means we're done
			}
		}

		// Only update if state changed
		if (should_be_required !== this.__is_required) {
			if (should_be_required) {
				this.__makeFieldRequired();
			} else {
				this.__makeFieldOptional();
			}
		}
	}

	__init() {
		this.__addObservers();
		this.__prepareIndicator();
		this.__checkIfRequired();
	}

	// Static utility methods
	static __getLabelBoundaries($label) {
		const $children = $label.childNodes;
		let $first_child = $label.firstChild;
		let $last_child = $label.lastChild;
		const contains_field = $label.matches(':has(input,select,textarea)');

		// Use Node constants for better performance
		const TEXT_NODE = 3;
		const ELEMENT_NODE = 1;

		// skip empty text nodes
		while (
			$first_child.nodeType === TEXT_NODE &&
			$first_child.textContent.trim() === ''
		) {
			if ($first_child.nextSibling) {
				$first_child = $first_child.nextSibling;
			} else {
				break;
			}
		}
		while (
			$last_child.nodeType === TEXT_NODE &&
			$last_child.textContent.trim() === ''
		) {
			if ($last_child.previousSibling) {
				$last_child = $last_child.previousSibling;
			} else {
				break;
			}
		}

		// with a field in the label, the calculation is a bit more complicated
		if (contains_field) {
			// field comes first
			if (
				$first_child.nodeType === ELEMENT_NODE &&
				$first_child.matches('input,select,textarea') &&
				$first_child.nextSibling
			) {
				$first_child = $first_child.nextSibling;
			}
			// field comes somewhere in the middle
			else {
				// Use traditional for loop instead of spread + find for better performance
				let $field = null;
				for (let i = 0; i < $children.length; i++) {
					const $child = $children[i];
					if (
						$child.nodeType === ELEMENT_NODE &&
						$child.matches('input,select,textarea')
					) {
						$field = $child;
						break;
					}
				}
				if ($field) {
					$last_child = $field.previousSibling
						? $field.previousSibling
						: $field;
				}
			}
		}
		return [$first_child, $last_child];
	}

	static __trimTextNodes($label) {
		const TEXT_NODE = 3;
		const $children = $label.childNodes;
		// Use traditional for loop instead of spread + forEach
		for (let i = 0; i < $children.length; i++) {
			const $node = $children[i];
			if (
				$node.nodeType === TEXT_NODE &&
				$node.textContent.trim() !== ''
			) {
				$node.textContent = $node.textContent.trim();
			}
		}
	}

	static __getCurrentValue($field) {
		// Single checkbox
		if ($field.type === 'checkbox' && !$field.length) {
			// Only return the value if the checkbox is actually checked
			if ($field.checked) {
				// Return the value, defaulting to "on" if not explicitly set
				return $field.value || 'on';
			}
			return '';
		}

		// Checkbox array (multiple checkboxes with same name)
		if ($field.length && $field[0].type && $field[0].type === 'checkbox') {
			const value = [];
			// Use forward loop to avoid reverse() call
			for (let i = 0; i < $field.length; i++) {
				const $current_field = $field[i];
				if ($current_field.checked) {
					value.push($current_field.value);
				}
			}
			return value;
		}

		// Radio buttons and other inputs
		return $field.value;
	}

	static __valuesMatch(condition_value, current_value) {
		// Use strict equality and early returns for better performance
		if (condition_value === current_value) {
			return true;
		}

		if (condition_value === '*' && current_value !== '') {
			return true;
		}

		if (
			Array.isArray(current_value) &&
			current_value.includes(condition_value)
		) {
			return true;
		}

		return false;
	}
}

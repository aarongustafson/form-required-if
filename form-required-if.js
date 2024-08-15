class FormRequiredIfElement extends HTMLElement {
	connectedCallback() {
		this.__$field = this.querySelector("input:not([type=submit],[type=image],[type=button]),select,textarea");
		this.__$form = this.closest("form");
		this.__is_required = false;

		this.__conditions = this.getAttribute("conditions").split("||");
		this.__$fields = {};
		
		this.__indicator = this.getAttribute("indicator");
		this.__indicator_position = this.getAttribute("indicator-position");
		this.__$indicator = null;
		this.__$indicator_placeholder = null;
		
		this.__init();
	}

	__addObservers() {
		this.__$form.addEventListener("change", this.__checkIfRequired.bind(this), false);
		this.__$form.addEventListener("keyup", this.__checkIfRequired.bind(this), false);
	}

	__toggleIndicator() {
		if ( ! this.__$indicator ) {
			return;
		}
		if ( this.__$indicator.hidden ) {
			this.__$indicator.hidden = false;
			this.__$indicator.removeAttribute("aria-hidden");
		} else {
			this.__$indicator.hidden = true;
			this.__$indicator.setAttribute("aria-hidden","true");
		}
	}

	__getLabelBoundaries( $label ) {
		const $children = $label.childNodes;
		let $first_child = $label.firstChild;
		let $last_child = $label.lastChild;
		const contains_field = $label.matches(":has(input,select,textarea)");

		// skip empty text nodes
		while ( $first_child.nodeType == 3 && $first_child.textContent.trim() == "" ) {
			if ( $first_child.nextSibling ) {
				$first_child = $first_child.nextSibling;
			} else {
				break;
			}
		}
		while ( $last_child.nodeType == 3 && $last_child.textContent.trim() == "" ) {
			if ( $last_child.previousSibling ) {
				$last_child = $last_child.previousSibling;
			} else {
				break;
			}
		}

		// with a field in the label, the calculation is a bit more complicated
		if ( contains_field ) {
			// field comes first
			if ( $first_child.nodeType == "1" &&
					 $first_child.matches("input,select,textarea") &&
					 $first_child.nextSibling ) {
				$first_child = $first_child.nextSibling;
			} else
			// field comes somewhere in the middle
			{
				let $field = [...$children].find($child => {
					return $child.nodeType == "1" && $child.matches("input,select,textarea")
				});
				if ( $field ) {
					$last_child = $field.previousSibling ? $field.previousSibling : $field;
				}
			}
		}
		return [ $first_child, $last_child ];
	}

	__trimTextNodes( $label ) {
		[...$label.childNodes].forEach($node => {
			if ( $node.nodeType == 3 && 
					 $node.textContent.trim() != "" ) {
				$node.textContent = $node.textContent.trim();
			}
		});
	}
	
	__prepareIndicator() {
		if ( ! this.__indicator ) { return; }

		if ( ! this.__indicator_position ) {
			this.__indicator_position = "after";
		}

		const $label = this.querySelector('label');
		const [ $label_start, $label_end ] = this.__getLabelBoundaries( $label );
		this.__trimTextNodes( $label );

		if ( this.__indicator.indexOf("<") !== 0 ) {
			this.__$indicator = document.createElement("span");
			this.__$indicator.innerHTML = this.__indicator;
		} else {
			let $template = document.createElement('template');
			$template.innerHTML = this.__indicator;
			this.__$indicator = $template.content.firstElementChild;
		}

		this.__toggleIndicator();

		if ( this.__indicator_position == "after" ) {
			if ( $label_end.nextSibling ) {
				$label.insertBefore( this.__$indicator, $label_end.nextSibling );
			} else {
				$label.appendChild( this.__$indicator );
			}
		} else {
			$label.insertBefore( this.__$indicator, $label_start );
		}
		
	}

	__makeFieldRequired() {
		this.__$field.required = true;
		this.__$field.setAttribute("aria-required", "true");
		this.__toggleIndicator();
		this.__is_required = true;
	}

	__makeFieldOptional() {
		this.__$field.required = false;
		this.__$field.removeAttribute("aria-required");
		this.__toggleIndicator();
		this.__is_required = false;
	}

	__getCurrentValue( $field ) {
		// Checkboxes are special
		if ( $field.length &&
				 $field[0].type &&
				 $field[0].type == "checkbox" ) {
			let value = [];
			let length = $field.length;
			while ( length-- ) {
				let $current_field = $field[length];
				if ( $current_field.checked ) {
					value.push( $current_field.value );
				}
			}
			value.reverse();
			return value;
		}
		return $field.value;
	}

	__valuesMatch( condition_value, current_value ) {
		let match = false;
		
		// precise match
		if ( condition_value == current_value ) {
			match = true;
		} else
		
		// Anything
		if ( condition_value == "*" && current_value != "" ) {
			match = true;
		} else

		// Checkboxes
		if ( current_value instanceof Array && 
				 current_value.includes( condition_value )
		) {
			match = true;
		}

		return match;
	}
	
	__checkIfRequired() {
		let should_be_required = false;
		let test_conditions = this.__conditions;
		test_conditions.forEach(condition => {
			const [ name, value ] = condition.split("=");
			
			const $field = this.__$form.elements[name];
			if ( ! $field ) { return; }

			const current_value = this.__getCurrentValue( $field );
			if ( this.__valuesMatch( value, current_value ) ) {
				should_be_required = true;
			}
		});
		if ( should_be_required && ! this.__is_required ) {
			this.__makeFieldRequired();
		} else if ( ! should_be_required && this.__is_required ) {
			this.__makeFieldOptional();
		}
	}
	
	__init() {
		this.__addObservers();
		this.__prepareIndicator();
		this.__checkIfRequired();
	}
}

if( !!customElements ) {
	customElements.define("form-required-if", FormRequiredIfElement);
}

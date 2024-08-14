export class FormRequiredIfElement extends HTMLElement {
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
	
	__prepareIndicator() {
		if ( ! this.__indicator ) { return; }

		if ( ! this.__indicator_position ) {
			this.__indicator_position = "after";
		}

		const $label = this.querySelector('label');
		const $label_text = [...$label.childNodes].filter(node=>node.nodeType=="3")[0];
		const $next_sibling = $label_text.nextSibling;

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
			$label_text.nodeValue = $label_text.nodeValue.trimEnd();
			if ( $next_sibling ) {
				$label.insertBefore( this.__$indicator, $next_sibling );
			} else {
				$label.appendChild( this.__$indicator );
			}
		} else {
			$label.insertBefore( this.__$indicator, $label_text );
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
	
	__checkIfRequired() {
		let should_be_required = false;
		let test_conditions = this.__conditions;
		test_conditions.forEach(condition => {
			const [ name, value ] = condition.split("=");
			
      const $field = this.__$form.elements[name];
      if ( ! $field ) { return; }
			
			const current_value = $field.value;
      if ( ( value == "*" && current_value != "" ) || value == current_value ) {
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

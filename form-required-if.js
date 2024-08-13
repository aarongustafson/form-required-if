class FormRequiredIfElement extends HTMLElement {
	connectedCallback() {
		this.__field = this.querySelector("input:not([type=submit],[type=image],[type=button]),select,textarea");
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
		this.__conditions.forEach(condition=>{
			const [ field ] = condition.split("=");
			const $field = document.querySelector(`[name=${field}]`);
			if ( $field ) {
				this.__$fields[field] = $field;
				$field.addEventListener("change", this.__checkIfRequired.bind(this), false);
				$field.addEventListener("keyup", this.__checkIfRequired.bind(this), false);
			}
		});
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
		this.__field.required = true;
		this.__field.setAttribute("aria-required", "true");
		this.__toggleIndicator();
		this.__is_required = true;
	}

	__makeFieldOptional() {
		this.__field.required = false;
		this.__field.removeAttribute("aria-required");
		this.__toggleIndicator();
		this.__is_required = false;
	}
	
	__checkIfRequired( e ) {
		let should_be_required = false;
		let test_conditions = this.__conditions;
		if ( e ) {
			const field_name = e.target.getAttribute("name");
			test_conditions =  this.__conditions.filter(condition => condition.trim().match(new RegExp(`^${field_name}=`)));
		}
		test_conditions.forEach(condition => {
			const [ field, value ] = condition.split("=");
			
			if ( ! this.__$fields[field] ) { return; }
			const $field = this.__$fields[field];

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

# Required If Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-required-if.svg)](https://www.npmjs.com/package/@aarongustafson/form-required-if) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-required-if/ci.yml?branch=main)](https://github.com/aarongustafson/form-required-if/actions)

Currently, HTML only supports making a field required or optional. Sometimes you need a field to be required only when certain other fields have a (particular) value. The `form-required-if` web component enables that.

## TypeScript & Framework Support

- Ships with `.d.ts` definitions so editors and TypeScript builds get full type information for `FormRequiredIfElement`.
- `conditions`, `indicator`, and `indicator-position` now reflect between properties and attributes, keeping frameworks in sync with DOM state.
- `_upgradeProperty` ensures properties set before the element is defined are captured and reflected once connected.

## Demos

- [Comprehensive Demo](https://aarongustafson.github.io/form-required-if/demo/) ([Source](./demo/index.html))
- [ESM.sh CDN Demo](https://aarongustafson.github.io/form-required-if/demo/esm.html) ([Source](./demo/esm.html))
- [unpkg CDN Demo](https://aarongustafson.github.io/form-required-if/demo/unpkg.html) ([Source](./demo/unpkg.html))

## Installation

```bash
npm install @aarongustafson/form-required-if
```

## Usage

### Option 1: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FormRequiredIfElement } from '@aarongustafson/form-required-if';

// Define with default name
customElements.define('form-required-if', FormRequiredIfElement);

// Or define with a custom name
customElements.define('my-conditional-required', FormRequiredIfElement);
```

### Option 2: Auto-define the custom element (browser environments only)

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/form-required-if/define.js';
```

If you prefer to control when the element is registered, call the helper directly:

```javascript
import { defineFormRequiredIf } from '@aarongustafson/form-required-if/define.js';

defineFormRequiredIf();
```

You can also include the guarded script from HTML:

```html
<script
	src="./node_modules/@aarongustafson/form-required-if/define.js"
	type="module"
></script>
```

### CDN Usage

You can also use the component directly from a CDN:

```html
<script
	src="https://unpkg.com/@aarongustafson/form-required-if@latest/define.js"
	type="module"
></script>
```

## API

<ul>
  <li><code>conditions</code><br> A double pipe (||) separated list of `name`/`value` pairs. When fields with the provided `name` values are updated, the value of those fields will be compared against the values you provided (or * for anything). If any resolve to true, the field will become required, otherwise it won't be.</li>
  <li><code>indicator</code> (optional)<br> If you include a visual indicator on the label of required fields (e.g., *), put that here. HTML is acceptable.</li>
  <li><code>indicator-position</code> (optional)<br> "before" || "after" - Default: "after"<br> Indicates where you want the indicator placed, relative to the label.</li>
</ul>

## Markup Assumptions

This web component assumes the fields you reference in `conditions` exist in the DOM when the component is loaded. If they don’t, they will be ignored.

## Implementation notes

1. **Field markup changes.** When the field is in its required state, it will receive both the `required` and `aria-required="true"` attributes.
1. **Required indicator.** If you include a `indicator`, it will be injected into the label at the appropriate position (before or after the label text). If your indicator is HTML, that is what will be inserted. When the value is just text, it will be injected inside a `span`. In either case, the root element of the indicator will be set to both `hidden` and `aria-hidden="true"` while the field is not required. Those will be removed when the field is in its required state.

## Examples

### Basic Usage

```html
<form>
	<label for="email">Email</label>
	<input type="email" id="email" name="email" />

	<form-required-if conditions="email=*" indicator="*">
		<label for="phone">Phone (required if email provided)</label>
		<input type="tel" id="phone" name="phone" />
	</form-required-if>

	<button type="submit">Submit</button>
</form>
```

### Multiple Conditions (OR logic)

```html
<form-required-if conditions="email=*||phone=*" indicator="<b>*</b>">
	<label for="name">Name (required if email OR phone provided)</label>
	<input type="text" id="name" name="name" />
</form-required-if>
```

### Specific Value Conditions

```html
<form-required-if conditions="contact-method=email" indicator="*">
	<label for="email">Email Address</label>
	<input type="email" id="email" name="email" />
</form-required-if>
```

### Checkbox Conditions

```html
<form-required-if conditions="newsletter=yes" indicator="*">
	<label for="email">Email (required for newsletter)</label>
	<input type="email" id="email" name="email" />
</form-required-if>
```

### Custom Indicator Positioning

```html
<form-required-if
	conditions="email=*"
	indicator="*"
	indicator-position="before"
>
	<label for="phone">Phone</label>
	<input type="tel" id="phone" name="phone" />
</form-required-if>
```

## Required instructions and demo styles

The component doesn’t paint fields, move focus, or replace native validation.
It updates `required`, `aria-required`, and the optional authored indicator.
Keep a visible label and explain the condition before someone needs to meet it.
Use `aria-describedby` to associate additional instructions with the field.
Don’t rely on a changed color or an unexplained asterisk.

The demos pair reading surfaces with `CanvasText`/`Canvas`, buttons and inline
code with `ButtonText`/`ButtonFace`, and fields and code blocks with
`FieldText`/`Field`. They leave native keyboard focus intact. Supporting text
inherits its surface’s foreground; the Canvas-backed footer uses an 80%
foreground mix, with full-strength fallbacks for unsupported mixing, forced
colors, and increased contrast.
Forced-color rules give fields and code blocks a solid `Field` backplate and
buttons and standalone inline code a solid `ButtonFace` backplate, including
button hover. They don’t rely on gradients that the browser may suppress.

Required labels retain the deliberate black-on-pink example theme, with a
border beside the label. These are demo styles, not component defaults.
Where an example already has supporting text, `aria-describedby` references
that text rather than adding a second instruction. The text stays visible
outside the label, so it contributes to the field’s description rather than
repeating in its accessible name. Examples without supporting text keep their
existing labels and explanations. Native required-field validation and authored
indicators still communicate the changing state without live announcements.
Translate labels, conditional instructions, and `indicator` content in your
markup. Native validation messages come from the browser.

Without JavaScript, or if the module fails to load, the demos keep their native
fields available and explain which details to provide. Conditional requirements
aren’t enforced without the enhancement; validate them on the server as well.
The “Other” examples hide their dependent field only after registration and
keep entered values when another option is selected.

The demo forms are validation-only, not message-sending examples. Each uses
`method="dialog"` outside a `<dialog>`: native submission first checks validity,
then the dialog submission method returns without navigating or sending form
data because there’s no ancestor dialog to close. The submit buttons say “Check
details”; valid entries remain in place. This doesn’t depend on an event handler,
so it also works without JavaScript or when registration or component loading
fails. Reset buttons still clear entries through native form behavior. If you
adapt the examples for a real service, choose its submission method and endpoint
and validate the conditional requirements on that server.

This styling update doesn’t change lifecycle behavior. One existing limitation:
if an already-required field is disconnected, its condition is cleared while
detached, and the same element is reconnected, its native `required` state can
remain stale until the condition next becomes true and then false. Avoid that
sequence when moving live form controls.

Treat `indicator` HTML as trusted author content: the component inserts it as
markup, not sanitized text. Don’t put untrusted input in that attribute. Use
paired foreground/background colors when customizing the examples, and check
text, boundaries, and focus against their actual adjacent surfaces.

The browser suite checks the study’s 19 distinct six-color palettes (62
observations), the retained required-label theme, light/dark rendering, native
validation and keyboard focus, reset, narrow layouts with enlarged text, and
JavaScript/module failure. CDN tests substitute local modules to keep them
deterministic; they don’t verify CDN availability. Forced-color emulation and
palette substitution don’t establish OS-level painting or assistive-technology
conformance. Manual Windows themes, screen readers, and browser UI zoom still
need review. Ubuntu WebKit’s known dark `ButtonText`/`ButtonFace` contrast
limitation has a narrowly scoped expected-failure test; other checks retain
their normal thresholds.

## Browser Support

This web component works in all modern browsers that support:

- Custom Elements v1
- ES Modules (for module usage)

For older browsers, you may need polyfills for Custom Elements.

## Development

### Testing

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Install browser engines once, then run with one worker
npx playwright install chromium firefox webkit
npm run test:browser

# Serve the demos locally without caching (defaults to port 4191)
npm run preview
# Use a separate port for a preview alongside browser tests
PORT=3014 npm run preview
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

# Required If Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-required-if.svg)](https://www.npmjs.com/package/@aarongustafson/form-required-if) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-required-if/ci.yml?branch=main)](https://github.com/aarongustafson/form-required-if/actions)

Currently, HTML only supports making a field required or optional. Sometimes you need a field to be required only when certain other fields have a (particular) value. The `form-required-if` web component enables that.

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
<script src="./node_modules/@aarongustafson/form-required-if/define.js" type="module"></script>
```

### CDN Usage

You can also use the component directly from a CDN:

```html
<script src="https://unpkg.com/@aarongustafson/form-required-if@latest/define.js" type="module"></script>
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
  <input type="email" id="email" name="email">

  <form-required-if conditions="email=*" indicator="*">
    <label for="phone">Phone (required if email provided)</label>
    <input type="tel" id="phone" name="phone">
  </form-required-if>

  <button type="submit">Submit</button>
</form>
```

### Multiple Conditions (OR logic)

```html
<form-required-if conditions="email=*||phone=*" indicator="<b>*</b>">
  <label for="name">Name (required if email OR phone provided)</label>
  <input type="text" id="name" name="name">
</form-required-if>
```

### Specific Value Conditions

```html
<form-required-if conditions="contact-method=email" indicator="*">
  <label for="email">Email Address</label>
  <input type="email" id="email" name="email">
</form-required-if>
```

### Checkbox Conditions

```html
<form-required-if conditions="newsletter=yes" indicator="*">
  <label for="email">Email (required for newsletter)</label>
  <input type="email" id="email" name="email">
</form-required-if>
```

### Custom Indicator Positioning

```html
<form-required-if conditions="email=*" indicator="*" indicator-position="before">
  <label for="phone">Phone</label>
  <input type="tel" id="phone" name="phone">
</form-required-if>
```

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
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

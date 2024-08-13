# Required If Web Component

Currently, HTML only supports making a field required or optional. Sometimes you need a field to be required only when certain other fields have a (particular) value. The `form-required-if` web component enables that.

## API

<ul>
  <li><code>conditions</code><br> A double pipe (||) separated list of `name`/`value` pairs. When fields with the provided `name` values are updated, the value of those fields will be compared against the values you provided (or * for anything). If any resolve to true, the field will become required, otherwise it won’t be.</li>
  <li><code>indicator</code> (optional)<br> If you include a visual indicator on the label of required fields (e.g., *), put that here. HTML is acceptable.</li>
  <li><code>indicator-position</code> (optional)<br> "before" || "after" - Default: "after"<br> Indicates where you want the indicator placed, relative to the label.</li>
</ul>

## Markup Assumptions

This web component assumes the fields you reference in `conditions` exist in the DOM when the component is loaded. If they don’t, they will be ignored.

## Implementation notes

1. **Field markup changes.** When the field is in its required state, it will receive both the `required` and `aria-required="true"` attributes.
1. **Required indicator.** If you include an `indicator`, it will be injected into the label at the appropriate position (before or after the label text). If your indicator is HTML, that is what will be inserted. If your value is just text, it will be injected inside a `span`. In either case, the root element of the indicator will be set to both `hidden` and `aria-hidden="true"` while the field is not required. Those will be removed when the field is in its required state.

## Example

```html
<form-required-if conditions="email=*" indicator="<b>*</b>">
  <label>Required if there’s an email value
    <input type="text" name="depends-on-email-or-test">
  </label>
</form-required-if>
```

## Demo

[Live Demo](https://aarongustafson.github.io/form-required-if/demo.html) ([Source](./demo.html))

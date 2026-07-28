# Teardown and reinitialize lab

Inspect progressive enhancement, plugin teardown, exact author-DOM comparison, host restoration, and reinitialization.

## What this example shows

- Semantic quiz markup that exists before JavaScript enhancement.
- `destroy()` lifecycle cleanup with visible checks for generated artifacts.
- An exact `outerHTML` comparison against the captured author baseline.
- Optional host-level restoration from a pristine clone and subsequent reinitialization.

## How to run

Build the package first:

```bash
npm run build:dist
```

Then open or serve `examples/teardown-reinitialize/index.html`.

## What to try

- Complete or partially complete the quiz before teardown.
- Destroy the instance and inspect both audit results.
- Restore the pristine author baseline when the exact comparison reports a difference.
- Reinitialize and repeat the interaction.

## Accessibility notes

- The authored form uses native fieldset, legend, radio, label, button, and details elements.
- External lifecycle controls are real buttons, and status text announces each transition.
- Audit results include explicit text in addition to color treatment.
- Lifecycle actions do not force focus, and the page has no required motion.
- Exact DOM equality is intentionally stricter than functional cleanup.

## Files

- `index.html`
- `styles.css`

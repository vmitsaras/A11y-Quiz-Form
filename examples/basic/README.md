# Basic single-answer example

This example progressively enhances one semantic single-answer form with validation, two
attempts, answer feedback, an optional reveal action, and an attempt progress indicator.

## What this example shows

- A native radio-group question enhanced in practice mode.
- Validation feedback before an answer is selected.
- Targeted feedback after an incorrect first attempt.
- Successful recovery, answer reveal, final incorrect, progress, reset, and no-JavaScript
  fallback states.
- The shared standalone-demo presentation used by the other focused examples.

The form sets `data-disable-check-until-answered="false"` so reviewers can trigger and inspect
the validation state before selecting an answer. Production integrations can retain the default
disabled check action when that better suits their flow.

## How to run

Build the package before opening the file:

```bash
npm run build:dist
```

The example imports `../../dist/index.js` and `../../dist/styles.css`, so it also works
when served from the repository root after a local build. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/examples/basic/` in a browser. A static server is recommended
instead of opening the HTML file directly because the example uses a JavaScript module import.

## What to try

- Check the form without selecting an answer and inspect the validation feedback.
- Select the incorrect answer, check it, and inspect the retry feedback.
- Choose **Show correct answer** after an incorrect first attempt, then reset.
- Check the incorrect answer twice to inspect the final incorrect result, then reset.
- Change to the correct answer and check again.
- Use Tab, arrow keys, Space, and Enter without a pointer.

## Accessibility notes

Use Tab and Shift+Tab to move through the native controls, arrow keys to change the radio
selection, and Space or Enter to activate the focused control. Inspect the associated
instructions, validation error, polite result feedback, visible focus indicator, and
no-JavaScript fallback when testing the example with assistive technology.

The plugin supports accessible implementations but does not replace testing with the target
browser and assistive-technology combinations. One instance manages one question; score
aggregation and persistence are outside this example.

## Files

- `index.html`
- `styles.css`

# Quiz state playground

Apply mode and option presets to one quiz while keeping demo configuration outside the plugin root.

## What this example shows

- Practice, exam, and review modes.
- Guided retry, strict check, and explore option presets.
- Safe destroy/reset/reinitialize sequencing for a configuration change.
- A text readout of state, effective mode, attempts, selection, and active preset.

## How to run

Build the package first:

```bash
npm run build:dist
```

Then open or serve `examples/state-playground/index.html`.

## What to try

- Submit a wrong answer under each practice preset.
- Apply exam mode and inspect the normalized one-attempt limit.
- Apply review mode and inspect its read-only revealed state.
- Use only the keyboard to apply a configuration and complete the quiz.

## Accessibility notes

- The configuration form and runtime quiz are separate semantic regions and forms.
- Native controls retain their expected keyboard behavior.
- Separate polite status regions report configuration and quiz changes.
- Applying a configuration does not force focus, and the page has no required motion.
- Exam mode is not a secure assessment system.

## Files

- `index.html`
- `styles.css`

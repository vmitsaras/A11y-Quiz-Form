# Dynamic quiz refresh lab

Add, replace, and remove quiz answers after initialization while inspecting selection
migration, focus recovery, rebuilt descriptions, and refresh lifecycle details.

## What this example shows

- `quiz.refresh({ preserveSelection: true })` after a synchronous DOM update.
- Stable selection migration across completely replaced answer elements.
- Dynamic answer addition and removal with refresh event counts.
- Predictable focus recovery when the currently focused answer is removed.
- The difference between the plugin's silent refresh and an opt-in host announcement.
- Repeated refresh calls and baseline restoration without reinitializing the plugin.

## How to run

Build the package first:

```bash
npm run build:dist
```

Then open or serve `examples/dynamic-content-refresh/index.html`.

## What to try

- Select an answer and replace the answer set with selection preservation enabled.
- Disable preservation, replace again, and compare the resulting selection.
- Add a distractor and inspect the `added` and `removed` event fields.
- Arm one-time removal, focus a radio answer, and change it with an arrow key. The option turns off after one removal.
- Toggle host announcements and compare them with the plugin's silent refresh behavior.

## Accessibility notes

- Native fieldset, legend, labels, radio buttons, details, and buttons provide the semantic baseline.
- Refresh leaves retained focus alone and recovers focus when a managed active control disappears.
- The refresh event inspection log is not a live region.
- Host announcements are explicitly opt-in and remain separate from plugin feedback.
- Visible counts and state text do not rely on color.
- Shared demo styles preserve visible focus, forced-colors support, and reduced-motion behavior.
- Stable and unique input type, name, and value combinations are required for predictable migration.

## Files

- `index.html`
- `styles.css`

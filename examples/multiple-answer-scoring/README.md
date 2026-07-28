# Multiple-answer scoring lab

Compare exact and partial scoring with two matched, progressively enhanced checkbox quizzes.

## What this example shows

- Exact scoring requires every correct option and no incorrect option.
- Partial scoring accepts a non-empty correct subset, provided no incorrect option is selected.
- All-or-nothing is a compatibility alias of exact scoring, so it is not repeated as a third quiz.
- Native checkbox interaction, retry feedback, progress, reset, and result announcements.

## How to run

Build the package first:

```bash
npm run build:dist
```

Then open or serve `examples/multiple-answer-scoring/index.html`.

## What to try

- Select one correct option in both quizzes and compare the results.
- Select every correct option in both quizzes.
- Mix a correct and incorrect option.
- Complete both quizzes with Tab and Space.

## Accessibility notes

- Native fieldsets, legends, labels, checkboxes, and buttons provide the semantic baseline.
- Visible text and polite status updates communicate feedback without color alone.
- Focus remains in the active form, and the page has no required motion.
- Partial mode returns a correct result for a valid subset; it does not calculate a numeric score.

## Files

- `index.html`
- `styles.css`

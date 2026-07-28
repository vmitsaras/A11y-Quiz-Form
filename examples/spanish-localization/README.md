# Spanish localization example

This example demonstrates a fully localized A11y Quiz Form interaction in Spanish while the
surrounding developer documentation remains in English.

## What it covers

- `lang="es"` scoped to the live quiz form
- Spanish author-provided question, hint, answers, explanations, actions, and no-JavaScript fallback
- all 16 `QuizFormMessages` keys overridden, including callback-based attempt and progress copy
- an enabled empty-submit path for testing localized validation
- incorrect-first-attempt, changed-answer, correct, reveal, progress, summary, and reset states

## Run it

From the repository root:

```bash
npm run build
python3 -m http.server 4173
```

Open <http://127.0.0.1:4173/docs/spanish-localization/>.

The page imports the built package from `../../dist/` in source form. The documentation build
rewrites those paths for the generated `docs/spanish-localization/` page.

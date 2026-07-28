# A11y Quiz Form

Accessible single- and multiple-answer quiz behavior for progressively enhanced native
HTML forms. The package supports practice, exam, and review modes without a framework or
runtime dependency.

The package is ESM-only and TypeScript-first. It does not auto-initialize when imported.

## Installation

The package metadata is ready for npm publishing. Confirm that the package is available in
your registry before installing it.

```bash
npm install a11y-quiz-form
```

```bash
pnpm add a11y-quiz-form
```

```bash
yarn add a11y-quiz-form
```

## Usage

Import the behavior and the default component styles, find a semantic quiz form, and create
an instance explicitly.

```ts
import { createQuizForm } from "a11y-quiz-form";
import "a11y-quiz-form/styles.css";

const form = document.querySelector("[data-a11y-quiz]");

if (form instanceof HTMLFormElement) {
  const quiz = createQuizForm(form, {
    maxAttempts: 2,
    showProgress: true,
  });

  quiz.getState();
}
```

Use `initQuizForms()` when a document or fragment contains multiple quiz forms:

```ts
import { initQuizForms } from "a11y-quiz-form";

const instances = initQuizForms();
```

Repeated initialization of the same form returns its existing instance.

## CSS

Default component styles are available from the CSS export:

```ts
import "a11y-quiz-form/styles.css";
```

The component uses the `.a11y-quiz` BEM block. Public theme properties use the
`--a11y-quiz-*` prefix; private properties beginning with `--_` are implementation details.

```css
.a11y-quiz {
  --a11y-quiz-color-action-bg: #5b21b6;
  --a11y-quiz-color-action-hover: #4c1d95;
  --a11y-quiz-color-focus-ring: #fbbf24;
  --a11y-quiz-radius: 0.75rem;
}
```

Useful public properties include `--a11y-quiz-color-bg`,
`--a11y-quiz-color-text`, `--a11y-quiz-color-border`,
`--a11y-quiz-color-correct-*`, `--a11y-quiz-color-incorrect-*`,
`--a11y-quiz-color-action-*`, `--a11y-quiz-color-focus-ring`,
`--a11y-quiz-radius`, `--a11y-quiz-spacing-*`, `--a11y-quiz-font-size-*`, and
`--a11y-quiz-max-width`.

The plugin adds `.is-initialized` to an enhanced form and applies the state classes
`.is-selected`, `.is-correct`, `.is-incorrect`, and `.is-previously-selected` to answer
cards. The form also receives `data-quiz-state` with one of `idle`, `answered`,
`checked-correct`, `checked-wrong-can-retry`, `checked-wrong-final`, or `revealed`.
The stylesheet provides visible `:focus-visible` indicators, text as well as color for answer
state, forced-colors rules, and a `prefers-reduced-motion` override that reduces transitions.

## HTML structure

The plugin does not generate question or answer content. Supply a native form with a
fieldset, legend, labeled inputs, feedback containers, and real buttons.

```html
<form class="a11y-quiz" data-a11y-quiz novalidate>
  <fieldset class="a11y-quiz__fieldset">
    <legend class="a11y-quiz__question">Which element performs a form action?</legend>
    <p class="a11y-quiz__instruction">Choose one answer.</p>

    <div class="a11y-quiz__answers">
      <div class="a11y-quiz__answer" data-correct="true">
        <label class="a11y-quiz__answer-label">
          <input class="a11y-quiz__input" type="radio" name="element" value="button">
          <span class="a11y-quiz__answer-text">&lt;button&gt;</span>
        </label>
        <p class="a11y-quiz__answer-note" hidden>Previously selected</p>
        <p class="a11y-quiz__explanation" hidden>
          A button has native semantics and keyboard behavior.
        </p>
      </div>
    </div>

    <p class="a11y-quiz__attempt-count" hidden></p>
    <p class="a11y-quiz__status"></p>

    <div class="a11y-quiz__actions">
      <button type="submit">Check answer</button>
      <button type="button" data-quiz-show-answer hidden>Show answer</button>
      <button type="button" data-quiz-reset hidden>Try again</button>
    </div>

    <div class="a11y-quiz__result-summary" hidden>
      <p class="a11y-quiz__result-summary-text"></p>
    </div>
  </fieldset>
</form>
```

Use radio buttons for one correct answer and checkboxes for multiple correct answers. Mark
each correct answer card with `data-correct="true"`.

### Selectors and data attributes

`[data-a11y-quiz]` is the primary initialization selector; `.js-a11y-quiz` is supported as a
compatibility selector. The expected child hooks are `.a11y-quiz__fieldset`,
`.a11y-quiz__answer`, `.a11y-quiz__input`, `.a11y-quiz__status`,
`.a11y-quiz__result-summary`, `.a11y-quiz__attempt-count`,
`[data-quiz-show-answer]`, and `[data-quiz-reset]`. The plugin creates a missing validation
container and, when `showProgress` is enabled, a missing progress container; authors should
provide the other feedback containers in the markup above.

Scalar options can be supplied as data attributes on the form:
`data-mode`, `data-max-attempts`, `data-explanation-mode`, `data-show-answer-mode`,
`data-scoring-mode`, `data-allow-reset`, `data-disable-after-complete`,
`data-focus-result`, `data-announce-changes`, `data-shuffle-answers`,
`data-show-progress`, and `data-disable-check-until-answered`. Programmatic options take
precedence. `data-quiz-state` is written by the plugin and should be treated as state output,
not configuration.

## API

### `createQuizForm(form, options?)`

Enhances one `HTMLFormElement` and returns a `QuizFormInstance`.

### `initQuizForms(options?, root?)`

Enhances forms matching `[data-a11y-quiz]` or the compatibility selector
`.js-a11y-quiz` within a document or another `ParentNode`.

### `new A11yQuizForm(form, options?)`

Class-based equivalent to `createQuizForm()`. Prefer the creation function for the smallest
public surface.

### Instance methods

- `check()` checks the current selection while the instance is active.
- `reveal()` reveals the correct answers and all explanations from an active state, or
  from a final incorrect state when its reveal action is available.
- `reset()` returns an active or completed practice/exam quiz to its initial interactive
  state when `allowReset` is `true`.
- `getState()` returns state, attempts, selected values, and correctness.
- `refresh(options?)` reconciles answer and supporting markup changed after initialization.
  Pass `{ preserveSelection: true }` to migrate selections to replacement inputs with the
  same type, name, and value.
- `destroy()` removes listeners and plugin-created feedback, restores author-owned attributes,
  properties, text content, and answer order to their pre-initialization values, then emits
  `a11yquiz:destroy`.

Mutating methods are intentionally inert after `destroy()`. They are also inert in review
mode. Ignored calls do not change state, dispatch interaction/completion events, announce
feedback, or move focus.

### State transition contract

| Current state / condition | `check()` | `reveal()` | `reset()` |
| --- | --- | --- | --- |
| `idle` or `answered` | Checks a non-empty selection and enters a checked state; an empty selection stays `idle` and shows validation. | Enters `revealed` and completes once. | Returns to `idle` when `allowReset` is `true`. |
| `checked-wrong-can-retry` | Uses the next attempt; the same unchanged selection may be checked again. | Enters `revealed` and completes once. | Returns to `idle` when `allowReset` is `true`. |
| `checked-correct` | No-op. | No-op. | Returns to `idle` when `allowReset` is `true`. |
| `checked-wrong-final` | No-op. | Enters `revealed` only when `showAnswerMode` leaves the reveal action available (`"always"` or `"after-final-attempt"`); does not emit completion again or move focus. | Returns to `idle` when `allowReset` is `true`. |
| `revealed` | No-op. | No-op. | Returns to `idle` when `allowReset` is `true`. |
| Review mode | No-op. | No-op. | No-op. |
| Destroyed instance | No-op. | No-op. | No-op. |

Reset clears attempts, validation, result classes, and generated feedback. It restores each
answer input's initial `checked` and `disabled` values rather than clearing or enabling every
input. It also permits a fresh completion event during the next run.

### Dynamic content refresh

Call `refresh()` after synchronously adding, removing, reordering, or replacing quiz answers,
descriptions, or action controls:

```ts
answers.replaceChildren(...nextAnswers);
quiz.refresh({ preserveSelection: true });
```

Refresh starts a new run with zero attempts and clears stale validation/result feedback.
Without `preserveSelection`, retained inputs return to the checked state captured when they
first entered the managed form. With it, checked state migrates by input `type`, `name`, and
`value`; those fields should therefore be unique and stable within a quiz. A missing selected
value is dropped.

The method rebuilds `aria-describedby` relationships, generates collision-safe IDs, and
rebinds replaced action buttons. It does not write to live regions or emit `change`, `reset`,
or result events. It emits one synchronous `a11yquiz:refresh` event after reconciliation.
Focus remains where it is when the focused node survives. If the focused quiz control was
removed, focus moves to its same-key replacement, the nearest remaining answer, an available
check action, or finally the form itself.

Refresh work is linear in the number of managed answers and description tokens, plus ID
collision checks. Batch DOM changes and call it once; the package does not observe mutations
automatically. It supports one input per `.a11y-quiz__answer`; nested quizzes, duplicate answer
keys, and concurrent DOM mutation during `refresh()` are outside the contract. Repeated calls
are idempotent and `destroy()` also restores author state captured for dynamically introduced
managed elements.

### Options

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `mode` | `"practice" \| "exam" \| "review"` | `"practice"` | Exam mode uses one attempt; review mode is read-only. |
| `maxAttempts` | `number` | `2` | Normalized to an integer from 1 through 100. |
| `explanationMode` | `QuizFormExplanationMode` | `"selected-after-wrong"` | Controls automatic explanation visibility. |
| `showAnswerMode` | `QuizFormShowAnswerMode` | `"after-first-wrong"` | Controls the optional reveal action's visibility. |
| `scoringMode` | `"exact" \| "partial" \| "all-or-nothing"` | `"exact"` | Controls complete-set or correct-subset acceptance for multiple-answer questions. |
| `allowReset` | `boolean` | `true` | Enables direct reset and shows reset after completion. |
| `disableAfterComplete` | `boolean` | `true` | Disables answer inputs after completion. |
| `focusResult` | `boolean` | `false` | Optionally focuses the result summary. |
| `announceChanges` | `boolean` | `true` | Writes feedback to the polite status region. |
| `shuffleAnswers` | `boolean` | `false` | Randomizes answer-card DOM order during initialization. |
| `showProgress` | `boolean` | `false` | Adds an attempt progress indicator. |
| `disableCheckUntilAnswered` | `boolean` | `true` | Disables submit until an answer is selected. |
| `messages` | `QuizFormMessages` | English catalog | Partially overrides generated validation, status, progress, summary, and answer-state text. |

Each scalar option can also be supplied through the equivalent kebab-case data attribute, such as
`data-max-attempts="3"` or `data-show-progress="true"`. Invalid dataset values fall back
to safe defaults. Programmatic options take precedence. The `messages` catalog is programmatic
only because its values can be callbacks.

### Localizing generated messages

Pass a partial `messages` catalog. A value can be a non-empty string or a callback that
receives attempt metadata. Missing keys keep their English defaults. If an override throws,
returns an empty or whitespace-only string, or has an invalid runtime type, the plugin uses the
English default for that key so visible and live-region feedback does not become empty.

```ts
import { createQuizForm, type QuizFormMessages } from "a11y-quiz-form";

const messages = {
  validationRequired: "Elige al menos una respuesta.",
  correct: ({ attempt }) => `Correcto en el intento ${attempt}.`,
  incorrectRetry: ({ remainingAttempts }) =>
    remainingAttempts === 1
      ? "Queda un intento."
      : `Quedan ${remainingAttempts} intentos.`,
  attemptCount: ({ attempt, maxAttempts }) =>
    `Intento ${attempt} de ${maxAttempts}`,
} satisfies QuizFormMessages;

createQuizForm(form, { messages });
```

Callback context is `Readonly<QuizFormMessageContext>`:

| Field | Type | Meaning |
| --- | --- | --- |
| `attempt` | `number` | Attempts used, including the current checked attempt. |
| `maxAttempts` | `number` | Normalized maximum attempts for the current mode. |
| `remainingAttempts` | `number` | Attempts still available, never below zero. |

The exported `QuizFormMessages` type provides this message-key table:

| Key | English default purpose | Typical destination |
| --- | --- | --- |
| `validationRequired` | Ask the user to choose an answer. | Assertive validation alert and polite status |
| `answerChanged` | Confirm a changed answer is ready to check. | Polite status |
| `correct` | Announce a correct result and attempt. | Polite status |
| `incorrectRetry` | Announce an incorrect result and remaining attempts. | Polite status |
| `incorrectFinal` | Announce the final incorrect result and revealed answer. | Polite status |
| `answerRevealed` | Confirm that the correct answer is shown. | Polite status |
| `summaryCorrect` | Summarize a correct completion. | Result summary |
| `summaryIncorrect` | Summarize an incorrect completion. | Result summary |
| `summaryRevealed` | Summarize a manual answer reveal. | Result summary |
| `selectedCorrect` | Mark the selected correct answer. | Per-answer state text |
| `correctAnswer` | Mark a correct answer that was not selected. | Per-answer state text |
| `selectedIncorrect` | Mark a selected incorrect final answer. | Per-answer state text |
| `retrySelectedIncorrect` | Mark an incorrect selection during a retry. | Per-answer state text |
| `attemptCount` | Show the current and maximum attempt counts. | Visible attempt count |
| `progress` | Describe used attempts as visible progress. | Progress indicator text |
| `progressValueText` | Provide concise progressbar value text. | `aria-valuetext` |

Keep validation and status messages meaningful, concise, and non-empty. Preserve the action,
result, and remaining-attempt context a user needs; do not rely on punctuation, color, or nearby
visual content to complete the meaning. Message callbacks intentionally receive attempt counts
only. Do not close over or place private response data, personal information, or secure answer
material in messages because text may be rendered visibly or announced by assistive technology.
The `defaultQuizFormMessages` export is available when an application needs to inspect or reuse
the English catalog.

### Scoring contract

`scoringMode` primarily affects multiple-answer checkbox questions. Radio questions have one
selected value, so the three modes produce the same result for valid single-answer markup.

| Mode | Correct result |
| --- | --- |
| `"exact"` | Every correct option and no incorrect options are selected. |
| `"partial"` | A non-empty subset of correct options and no incorrect options is selected. The result is boolean correctness, not a numeric score or percentage. |
| `"all-or-nothing"` | Compatibility alias of `"exact"`; it uses the same complete-set rule. |

### Mode contract

| Mode | Attempts and hints | Answer controls | Explanations | Public mutation |
| --- | --- | --- | --- | --- |
| `practice` | Uses configured attempts and hint visibility. | Uses configured reveal/reset/disable options. | Uses configured `explanationMode`. | Follows the state transition table. |
| `exam` | Forces one attempt and hides the hint. | Forces `showAnswerMode: "never"`; reset still follows `allowReset`. | Forces `explanationMode: "all-after-final"`. | Follows the state transition table. |
| `review` | Starts in `revealed`. | Inputs are disabled; check, reveal, and reset actions are hidden. | All explanations are visible. | `check()`, `reveal()`, and `reset()` are no-ops. |

### Explanation visibility contract

`explanationMode` controls automatic explanation visibility. Explicit `reveal()` and review
mode always show every explanation.

| `explanationMode` | Initial / after reset | Retryable wrong check | Correct check | Final attempt |
| --- | --- | --- | --- | --- |
| `"none"` | Hidden | Hidden | Hidden | Hidden |
| `"selected-after-wrong"` | Hidden | Shows only the selected answer's explanation. | Hidden | Shows only the selected answer's explanation when incorrect; hidden when correct. |
| `"all-after-correct"` | Hidden | Hidden | Shows all explanations. | Shows all only when the final result is correct. |
| `"all-after-final"` | Hidden | Hidden | Hidden before the attempt limit. | Shows all explanations when the attempt limit is reached, whether correct or incorrect. |
| `"all-immediate"` | Shows all explanations. | Shows all explanations. | Shows all explanations. | Shows all explanations. |

### Reveal and reset visibility contract

| `showAnswerMode` | `idle` / `answered` | Retryable wrong | Correct | Final wrong | `revealed` / review |
| --- | --- | --- | --- | --- | --- |
| `"always"` | Visible | Visible | Hidden | Visible | Hidden |
| `"after-first-wrong"` | Hidden | Visible | Hidden | Hidden | Hidden |
| `"after-final-attempt"` | Hidden | Hidden | Hidden | Visible until activated | Hidden |
| `"never"` | Hidden | Hidden | Hidden | Hidden | Hidden |

With `allowReset: true`, the reset action appears after correct, final-wrong, or revealed
completion and `reset()` is accepted in practice/exam mode. With `allowReset: false`, the
action stays hidden and direct `reset()` calls are ignored. Review mode always hides and
rejects reset. With `disableAfterComplete: true`, all inputs are disabled at completion;
reset restores their individual initial disabled states. With `false`, each input keeps its
current enabled/disabled state; review mode remains read-only regardless.

### Events

The plugin dispatches synchronous custom events from the form. Every event bubbles, is
non-composed and non-cancelable, and contains `instance` plus the compatibility alias `quiz`
in its detail.

| Constant | Event | Trigger | Additional detail |
| --- | --- | --- | --- |
| `quizFormEvents.init` | `a11yquiz:init` | Initial state captured; enhancement is about to begin. | — |
| `quizFormEvents.ready` | `a11yquiz:ready` | Enhancement and initial UI synchronization are complete. | — |
| `quizFormEvents.change` | `a11yquiz:change` | A managed answer input changes and selection UI is synchronized. | `selected` |
| `quizFormEvents.check` | `a11yquiz:check` | An active check is accepted, including an empty selection. | `selected`, `valid`, `attempt` |
| `quizFormEvents.correct` | `a11yquiz:correct` | Correct-result UI is complete. | `attempt` |
| `quizFormEvents.incorrect` | `a11yquiz:incorrect` | Retryable or final incorrect-result UI is complete. | `attempt`, `canRetry` |
| `quizFormEvents.retry` | `a11yquiz:retry` | Immediately after a retryable `incorrect` event. | `attempt` |
| `quizFormEvents.reveal` | `a11yquiz:reveal` | Answer-reveal UI is complete. | — |
| `quizFormEvents.reset` | `a11yquiz:reset` | An accepted reset has restored the initial interaction state. | — |
| `quizFormEvents.refresh` | `a11yquiz:refresh` | Dynamic content reconciliation is complete. | `preserveSelection`, `selected`, `added`, `removed` |
| `quizFormEvents.complete` | `a11yquiz:complete` | A run first reaches a terminal result. | `correct`, `revealed`, `attempt` |
| `quizFormEvents.destroy` | `a11yquiz:destroy` | Listener cleanup and author-DOM restoration are complete. | — |

Use `onQuizFormEvent()` for typed details and an idempotent cleanup function:

```ts
import { onQuizFormEvent, quizFormEvents } from "a11y-quiz-form";

const stopListening = onQuizFormEvent(
  document,
  quizFormEvents.complete,
  (event) => {
    const { correct, revealed, attempt } = event.detail;
    console.log({ correct, revealed, attempt });
  },
);

stopListening();
```

Guaranteed synchronous sequences are `init → ready`, `check → correct → complete`,
`check → incorrect → retry` for a retryable result, `check → incorrect → complete` for a
final wrong result, and `reveal → complete` when reveal first completes a run. A reveal after
final-wrong completion emits only `reveal`. Choose either `incorrect` or `retry` for a given
reaction to avoid duplicate work.

## Accessibility notes

- Native fieldsets, legends, labels, radio buttons, checkboxes, and buttons remain the
  foundation of the interaction.
- Instructions, hints, answer statuses, notes, and visible explanations are associated with
  the relevant controls through generated IDs and `aria-describedby`. Existing author-provided
  `aria-describedby` tokens are merged, deduplicated, and preserved.
- Missing-answer validation uses a visible assertive alert and `aria-errormessage`.
- Correct and incorrect results include visible text, so color is not the only signal.
- Focus stays on the current interaction by default. `focusResult` is opt-in.
- `destroy()` restores author-owned IDs, roles, live-region attributes, validation ARIA,
  focusability, control state, hidden state, text content, and shuffled answer order before its
  lifecycle event is dispatched, preventing stale generated-ID references after teardown.
- Radio-group arrow keys, Space, Enter, and form tab order use native browser behavior.
- The stylesheet includes visible focus indicators, forced-colors rules, and reduced-motion
  handling.
- The example includes a no-JavaScript answer fallback.

The package is designed to support accessible implementations, but it does not claim blanket
WCAG conformance. Test your content and supported browser/assistive-technology combinations.

### WCAG implementation evidence

| Criterion | Relevant implementation evidence | Verification boundary |
| --- | --- | --- |
| 3.2.2 On Input | Selecting an answer updates selection state only; checking, revealing, and resetting require an explicit action. Ignored terminal/review calls do not move focus. | Verify authored integrations do not attach additional context changes to answer inputs. |
| 3.3.1 Error Identification | An empty check exposes visible validation, `aria-invalid`, and `aria-errormessage` without consuming an attempt. | Verify the authored validation copy identifies the required correction clearly. |
| 4.1.2 Name, Role, Value | Native inputs and buttons retain their semantics; descriptions merge with author tokens; reset restores initial checked/disabled input state; teardown restores author-owned ARIA and control state. | Verify author-provided labels, legends, and control names. |
| 4.1.3 Status Messages | Existing status regions announce validation, retry, reveal, and completion feedback; completion is emitted once per run and ignored terminal calls do not repeat it. | Manual screen-reader verification is still needed for supported browser/AT combinations. |

### Limitations

- One instance manages one question form; score aggregation and persistence are out of scope.
- Correct answers are present in client-side `data-correct` attributes. Exam mode is not a
  secure assessment system.
- The plugin does not generate or sanitize author-provided question and explanation content.
- A formal browser compatibility matrix has not yet been published.

## Examples

- [Basic single-answer example](./examples/basic) demonstrates validation, retry feedback, answer reveal, and reset in a two-attempt practice flow.
- [Spanish localization example](./examples/spanish-localization) translates authored content and the complete generated message catalog.
- [Multiple-answer scoring lab](./examples/multiple-answer-scoring) compares exact and partial checkbox scoring.
- [State playground](./examples/state-playground) applies mode and option presets outside the runtime form.
- [Teardown and reinitialize lab](./examples/teardown-reinitialize) audits lifecycle cleanup and exact author-DOM restoration.
- [Dynamic content refresh lab](./examples/dynamic-content-refresh) demonstrates answer replacement, selection migration, focus recovery, and refresh event details.
- [Full live demo and compact documentation](./index.html)

Run `npm run build:dist` before opening source examples because they import from `dist/`.

## Docs metadata

Documentation aggregators can import the typed metadata object without parsing this README:

```ts
import { docs } from "a11y-quiz-form/docs";
```

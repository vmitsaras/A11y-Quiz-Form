const COMPONENT_NAME = "a11y-quiz-form";

export type QuizFormMode = "practice" | "exam" | "review";
export type QuizFormExplanationMode =
  | "none"
  | "selected-after-wrong"
  | "all-after-correct"
  | "all-after-final"
  | "all-immediate";
export type QuizFormShowAnswerMode =
  | "after-first-wrong"
  | "always"
  | "after-final-attempt"
  | "never";
export type QuizFormScoringMode = "exact" | "partial" | "all-or-nothing";
export type QuizFormState =
  | "idle"
  | "answered"
  | "checked-correct"
  | "checked-wrong-can-retry"
  | "checked-wrong-final"
  | "revealed";

export interface QuizFormMessageContext {
  attempt: number;
  maxAttempts: number;
  remainingAttempts: number;
}

export type QuizFormMessage =
  | string
  | ((context: Readonly<QuizFormMessageContext>) => string);

export interface QuizFormMessages {
  validationRequired?: QuizFormMessage;
  answerChanged?: QuizFormMessage;
  correct?: QuizFormMessage;
  incorrectRetry?: QuizFormMessage;
  incorrectFinal?: QuizFormMessage;
  answerRevealed?: QuizFormMessage;
  summaryCorrect?: QuizFormMessage;
  summaryIncorrect?: QuizFormMessage;
  summaryRevealed?: QuizFormMessage;
  selectedCorrect?: QuizFormMessage;
  correctAnswer?: QuizFormMessage;
  selectedIncorrect?: QuizFormMessage;
  retrySelectedIncorrect?: QuizFormMessage;
  attemptCount?: QuizFormMessage;
  progress?: QuizFormMessage;
  progressValueText?: QuizFormMessage;
}

export type QuizFormMessageKey = keyof QuizFormMessages;

export interface QuizFormOptions {
  mode?: QuizFormMode;
  maxAttempts?: number;
  explanationMode?: QuizFormExplanationMode;
  showAnswerMode?: QuizFormShowAnswerMode;
  scoringMode?: QuizFormScoringMode;
  allowReset?: boolean;
  disableAfterComplete?: boolean;
  focusResult?: boolean;
  announceChanges?: boolean;
  shuffleAnswers?: boolean;
  showProgress?: boolean;
  disableCheckUntilAnswered?: boolean;
  messages?: QuizFormMessages;
}

interface NormalizedQuizFormOptions {
  mode: QuizFormMode;
  maxAttempts: number;
  explanationMode: QuizFormExplanationMode;
  showAnswerMode: QuizFormShowAnswerMode;
  scoringMode: QuizFormScoringMode;
  allowReset: boolean;
  disableAfterComplete: boolean;
  focusResult: boolean;
  announceChanges: boolean;
  shuffleAnswers: boolean;
  showProgress: boolean;
  disableCheckUntilAnswered: boolean;
  messages: Readonly<Required<QuizFormMessages>>;
}

export interface QuizFormStateSnapshot {
  state: QuizFormState;
  attempts: number;
  maxAttempts: number;
  selected: string[];
  correct: boolean;
}

export interface QuizFormRefreshOptions {
  preserveSelection?: boolean;
}

export interface QuizFormInstance {
  readonly form: HTMLFormElement;
  readonly options: Readonly<NormalizedQuizFormOptions>;
  check(): void;
  reveal(): void;
  reset(): void;
  refresh(options?: QuizFormRefreshOptions): void;
  getState(): QuizFormStateSnapshot;
  destroy(): void;
}

function ordinal(value: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = value % 100;
  return `${value}${suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? suffixes[0]}`;
}

export const defaultQuizFormMessages = Object.freeze({
  validationRequired: "Please choose an answer before checking.",
  answerChanged: "Answer changed. Check your answer when you are ready.",
  correct: ({ attempt }: Readonly<QuizFormMessageContext>) =>
    attempt === 1 ? "Correct." : `Correct. You got it on your ${ordinal(attempt)} try.`,
  incorrectRetry: ({ remainingAttempts }: Readonly<QuizFormMessageContext>) =>
    remainingAttempts === 1
      ? "Not quite. You have one more try."
      : `Not quite. You have ${remainingAttempts} more tries.`,
  incorrectFinal: ({ maxAttempts }: Readonly<QuizFormMessageContext>) =>
    maxAttempts > 1
      ? "Not quite. The correct answer is shown below."
      : "Not quite. Here is the correct answer.",
  answerRevealed: "The correct answer is now shown.",
  summaryCorrect: ({ attempt }: Readonly<QuizFormMessageContext>) =>
    attempt === 1
      ? "Correct on first attempt."
      : `Correct on ${ordinal(attempt)} attempt.`,
  summaryIncorrect: "Incorrect after all attempts.",
  summaryRevealed: "Answer revealed.",
  selectedCorrect: "Your answer: correct",
  correctAnswer: "Correct answer",
  selectedIncorrect: "Your answer: incorrect",
  retrySelectedIncorrect: "Selected answer: incorrect",
  attemptCount: ({ attempt, maxAttempts }: Readonly<QuizFormMessageContext>) =>
    `Attempt ${attempt} of ${maxAttempts}`,
  progress: ({ attempt, maxAttempts }: Readonly<QuizFormMessageContext>) =>
    `Progress: ${attempt} of ${maxAttempts} attempts used.`,
  progressValueText: ({ attempt, maxAttempts }: Readonly<QuizFormMessageContext>) =>
    `${attempt} of ${maxAttempts} attempts used`,
} satisfies Required<QuizFormMessages>);

const DEFAULT_OPTIONS = Object.freeze({
  mode: "practice",
  maxAttempts: 2,
  explanationMode: "selected-after-wrong",
  showAnswerMode: "after-first-wrong",
  scoringMode: "exact",
  allowReset: true,
  disableAfterComplete: true,
  focusResult: false,
  announceChanges: true,
  shuffleAnswers: false,
  showProgress: false,
  disableCheckUntilAnswered: true,
  messages: defaultQuizFormMessages,
} satisfies NormalizedQuizFormOptions);

const SELECTORS = Object.freeze({
  root: "[data-a11y-quiz], .js-a11y-quiz",
  fieldset: ".a11y-quiz__fieldset",
  status: ".a11y-quiz__status",
  answers: ".a11y-quiz__answers",
  answer: ".a11y-quiz__answer",
  input: ".a11y-quiz__input",
  checkButton: '[type="submit"]',
  showAnswerButton: "[data-quiz-show-answer]",
  resetButton: "[data-quiz-reset]",
  summary: ".a11y-quiz__result-summary",
  summaryText: ".a11y-quiz__result-summary-text",
  attempts: ".a11y-quiz__attempt-count",
  validation: ".a11y-quiz__validation",
  progress: ".a11y-quiz__progress",
  question: ".a11y-quiz__question",
  instruction: ".a11y-quiz__instruction",
  hint: ".a11y-quiz__hint",
  hintContent: ".a11y-quiz__hint-content",
  actions: ".a11y-quiz__actions",
  answerNote: ".a11y-quiz__answer-note",
  answerStatus: ".a11y-quiz__answer-status",
  explanation: ".a11y-quiz__explanation",
});

const CLASSES = Object.freeze({
  initialized: "is-initialized",
  correct: "is-correct",
  incorrect: "is-incorrect",
  selected: "is-selected",
  previouslySelected: "is-previously-selected",
});

const ATTRIBUTES = Object.freeze({
  describedBy: "aria-describedby",
  errorMessage: "aria-errormessage",
  invalid: "aria-invalid",
  live: "aria-live",
  atomic: "aria-atomic",
  disabled: "aria-disabled",
  state: "data-quiz-state",
});

export const quizFormEvents = Object.freeze({
  init: "a11yquiz:init",
  ready: "a11yquiz:ready",
  change: "a11yquiz:change",
  check: "a11yquiz:check",
  correct: "a11yquiz:correct",
  incorrect: "a11yquiz:incorrect",
  retry: "a11yquiz:retry",
  reveal: "a11yquiz:reveal",
  reset: "a11yquiz:reset",
  refresh: "a11yquiz:refresh",
  complete: "a11yquiz:complete",
  destroy: "a11yquiz:destroy",
});

export interface QuizFormEventBaseDetail {
  readonly instance: QuizFormInstance;
  readonly quiz: QuizFormInstance;
}

export type QuizFormInitEventDetail = QuizFormEventBaseDetail;
export type QuizFormReadyEventDetail = QuizFormEventBaseDetail;

export interface QuizFormChangeEventDetail extends QuizFormEventBaseDetail {
  readonly selected: readonly string[];
}

export interface QuizFormCheckEventDetail extends QuizFormEventBaseDetail {
  readonly selected: readonly string[];
  readonly valid: boolean;
  readonly attempt: number;
}

export interface QuizFormCorrectEventDetail extends QuizFormEventBaseDetail {
  readonly attempt: number;
}

export interface QuizFormIncorrectEventDetail extends QuizFormEventBaseDetail {
  readonly attempt: number;
  readonly canRetry: boolean;
}

export interface QuizFormRetryEventDetail extends QuizFormEventBaseDetail {
  readonly attempt: number;
}

export type QuizFormRevealEventDetail = QuizFormEventBaseDetail;
export type QuizFormResetEventDetail = QuizFormEventBaseDetail;

export interface QuizFormRefreshEventDetail extends QuizFormEventBaseDetail {
  readonly preserveSelection: boolean;
  readonly selected: readonly string[];
  readonly added: number;
  readonly removed: number;
}

export interface QuizFormCompleteEventDetail extends QuizFormEventBaseDetail {
  readonly correct: boolean;
  readonly revealed: boolean;
  readonly attempt: number;
}

export type QuizFormDestroyEventDetail = QuizFormEventBaseDetail;

export interface QuizFormEventDetailMap {
  [quizFormEvents.init]: QuizFormInitEventDetail;
  [quizFormEvents.ready]: QuizFormReadyEventDetail;
  [quizFormEvents.change]: QuizFormChangeEventDetail;
  [quizFormEvents.check]: QuizFormCheckEventDetail;
  [quizFormEvents.correct]: QuizFormCorrectEventDetail;
  [quizFormEvents.incorrect]: QuizFormIncorrectEventDetail;
  [quizFormEvents.retry]: QuizFormRetryEventDetail;
  [quizFormEvents.reveal]: QuizFormRevealEventDetail;
  [quizFormEvents.reset]: QuizFormResetEventDetail;
  [quizFormEvents.refresh]: QuizFormRefreshEventDetail;
  [quizFormEvents.complete]: QuizFormCompleteEventDetail;
  [quizFormEvents.destroy]: QuizFormDestroyEventDetail;
}

export type QuizFormEventName = keyof QuizFormEventDetailMap;

export type QuizFormEvent<K extends QuizFormEventName> = CustomEvent<
  QuizFormEventDetailMap[K]
> & {
  readonly type: K;
  readonly target: HTMLFormElement;
};

export type QuizFormEventListener<K extends QuizFormEventName> = (
  event: QuizFormEvent<K>,
) => void;

type QuizFormEventPayloadMap = {
  [K in QuizFormEventName]: Omit<
    QuizFormEventDetailMap[K],
    keyof QuizFormEventBaseDetail
  >;
};

export function onQuizFormEvent<K extends QuizFormEventName>(
  target: EventTarget,
  name: K,
  listener: QuizFormEventListener<K>,
  options?: boolean | AddEventListenerOptions,
): () => void {
  const eventListener: EventListener = (event) => {
    listener(event as QuizFormEvent<K>);
  };
  let subscribed = true;

  target.addEventListener(name, eventListener, options);

  return () => {
    if (!subscribed) return;
    subscribed = false;
    target.removeEventListener(name, eventListener, options);
  };
}

const STATES = Object.freeze({
  idle: "idle",
  answered: "answered",
  checkedCorrect: "checked-correct",
  checkedWrongRetry: "checked-wrong-can-retry",
  checkedWrongFinal: "checked-wrong-final",
  revealed: "revealed",
} satisfies Record<string, QuizFormState>);

const MODES = Object.freeze<QuizFormMode[]>(["practice", "exam", "review"]);
const EXPLANATION_MODES = Object.freeze<QuizFormExplanationMode[]>([
  "none",
  "selected-after-wrong",
  "all-after-correct",
  "all-after-final",
  "all-immediate",
]);
const SHOW_ANSWER_MODES = Object.freeze<QuizFormShowAnswerMode[]>([
  "after-first-wrong",
  "always",
  "after-final-attempt",
  "never",
]);
const SCORING_MODES = Object.freeze<QuizFormScoringMode[]>([
  "exact",
  "partial",
  "all-or-nothing",
]);

type RuntimeOptions = Partial<Record<keyof NormalizedQuizFormOptions, unknown>>;

const MESSAGE_KEYS = Object.freeze(
  Object.keys(defaultQuizFormMessages) as QuizFormMessageKey[],
);

function toSafeBoolean(value: unknown, fallback: boolean): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function toSafeInteger(
  value: unknown,
  fallback: number,
  options: { min?: number; max?: number } = {},
): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) return fallback;
  if (options.min !== undefined && parsed < options.min) return fallback;
  if (options.max !== undefined && parsed > options.max) return fallback;

  return Math.trunc(parsed);
}

function toSafeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function readDataOptions(dataset: DOMStringMap): RuntimeOptions {
  return {
    mode: dataset.mode,
    maxAttempts: dataset.maxAttempts,
    explanationMode: dataset.explanationMode,
    showAnswerMode: dataset.showAnswerMode,
    scoringMode: dataset.scoringMode,
    allowReset: dataset.allowReset,
    disableAfterComplete: dataset.disableAfterComplete,
    focusResult: dataset.focusResult,
    announceChanges: dataset.announceChanges,
    shuffleAnswers: dataset.shuffleAnswers,
    showProgress: dataset.showProgress,
    disableCheckUntilAnswered: dataset.disableCheckUntilAnswered,
  };
}

function normalizeMessages(value: unknown): Readonly<Required<QuizFormMessages>> {
  const messages: Required<QuizFormMessages> = { ...defaultQuizFormMessages };
  if (!value || typeof value !== "object") return Object.freeze(messages);

  for (const key of MESSAGE_KEYS) {
    try {
      const candidate = (value as Record<string, unknown>)[key];
      if (typeof candidate === "string" || typeof candidate === "function") {
        messages[key] = candidate as QuizFormMessage;
      }
    } catch {
      // Ignore unreadable override properties and keep the safe default.
    }
  }

  return Object.freeze(messages);
}

function normalizeOptions(options: RuntimeOptions): NormalizedQuizFormOptions {
  const normalized: NormalizedQuizFormOptions = {
    mode: toSafeEnum(options.mode, MODES, DEFAULT_OPTIONS.mode),
    maxAttempts: toSafeInteger(options.maxAttempts, DEFAULT_OPTIONS.maxAttempts, {
      min: 1,
      max: 100,
    }),
    explanationMode: toSafeEnum(
      options.explanationMode,
      EXPLANATION_MODES,
      DEFAULT_OPTIONS.explanationMode,
    ),
    showAnswerMode: toSafeEnum(
      options.showAnswerMode,
      SHOW_ANSWER_MODES,
      DEFAULT_OPTIONS.showAnswerMode,
    ),
    scoringMode: toSafeEnum(
      options.scoringMode,
      SCORING_MODES,
      DEFAULT_OPTIONS.scoringMode,
    ),
    allowReset: toSafeBoolean(options.allowReset, DEFAULT_OPTIONS.allowReset),
    disableAfterComplete: toSafeBoolean(
      options.disableAfterComplete,
      DEFAULT_OPTIONS.disableAfterComplete,
    ),
    focusResult: toSafeBoolean(options.focusResult, DEFAULT_OPTIONS.focusResult),
    announceChanges: toSafeBoolean(
      options.announceChanges,
      DEFAULT_OPTIONS.announceChanges,
    ),
    shuffleAnswers: toSafeBoolean(
      options.shuffleAnswers,
      DEFAULT_OPTIONS.shuffleAnswers,
    ),
    showProgress: toSafeBoolean(options.showProgress, DEFAULT_OPTIONS.showProgress),
    disableCheckUntilAnswered: toSafeBoolean(
      options.disableCheckUntilAnswered,
      DEFAULT_OPTIONS.disableCheckUntilAnswered,
    ),
    messages: normalizeMessages(options.messages),
  };

  if (normalized.mode === "exam") {
    normalized.maxAttempts = 1;
    normalized.showAnswerMode = "never";
    normalized.explanationMode = "all-after-final";
  }

  return normalized;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export class A11yQuizForm implements QuizFormInstance {
  private static readonly instances = new WeakMap<HTMLFormElement, A11yQuizForm>();

  readonly form!: HTMLFormElement;
  readonly options!: Readonly<NormalizedQuizFormOptions>;

  private state: QuizFormState = STATES.idle;
  private attempts = 0;
  private previouslySelected: string[] = [];
  private completionEmitted = false;
  private readonly idPrefix!: string;
  private announceTimer: number | undefined;
  private destroyed = false;
  private createdValidationEl: HTMLElement | null = null;
  private createdProgressEl: HTMLElement | null = null;
  private readonly createdStatusElements = new Set<HTMLElement>();
  private readonly generatedIdElements = new Set<HTMLElement>();
  private lastFocusedControl:
    | { element: HTMLElement; kind: "input" | "check" | "show" | "reset"; key: string; index: number }
    | undefined;
  private readonly initialAttributes = new Map<
    HTMLElement,
    Map<string, string | null>
  >();
  private readonly initialContent = new Map<HTMLElement, Node[]>();
  private readonly initialChecked = new Map<HTMLInputElement, boolean>();
  private readonly initialDisabled = new Map<HTMLInputElement, boolean>();
  private initialAnswerEls: HTMLElement[] = [];
  private initialAnswerChildNodes: Node[] = [];

  private fieldsetEl: HTMLFieldSetElement | null = null;
  private statusEl: HTMLElement | null = null;
  private answersEl: HTMLElement | null = null;
  private answerEls: HTMLElement[] = [];
  private inputs: HTMLInputElement[] = [];
  private checkButton: HTMLButtonElement | null = null;
  private showAnswerButton: HTMLButtonElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private summaryEl: HTMLElement | null = null;
  private attemptsEl: HTMLElement | null = null;
  private validationEl: HTMLElement | null = null;
  private progressEl: HTMLElement | null = null;

  private readonly handleSubmit!: EventListener;
  private readonly handleChange!: EventListener;
  private readonly handleShowAnswer!: EventListener;
  private readonly handleReset!: EventListener;
  private readonly handleFocusIn!: EventListener;

  constructor(form: HTMLFormElement, options: QuizFormOptions = {}) {
    if (!form || form.tagName !== "FORM") {
      throw new TypeError(`${COMPONENT_NAME}: first argument must be a <form> element.`);
    }

    const existingInstance = A11yQuizForm.instances.get(form);
    if (existingInstance) return existingInstance;

    this.form = form;
    this.options = Object.freeze(
      normalizeOptions({ ...readDataOptions(form.dataset), ...options }),
    );
    this.idPrefix = form.id || `a11y-quiz-${Math.random().toString(36).slice(2, 9)}`;
    this.handleSubmit = this.onSubmit.bind(this);
    this.handleChange = this.onChange.bind(this);
    this.handleShowAnswer = this.onShowAnswer.bind(this);
    this.handleReset = this.onReset.bind(this);
    this.handleFocusIn = this.onFocusIn.bind(this);

    A11yQuizForm.instances.set(form, this);

    try {
      this.initialize();
    } catch (error) {
      A11yQuizForm.instances.delete(form);
      throw error;
    }
  }

  check(): void {
    if (!this.canCheck()) return;

    const selected = this.getSelectedValues();

    if (selected.length === 0) {
      const validationMessage = this.message("validationRequired");
      this.announce(validationMessage);
      if (this.statusEl && this.options.focusResult) {
        this.statusEl.setAttribute("tabindex", "-1");
        this.statusEl.focus();
      } else {
        this.inputs[0]?.focus();
      }
      this.setValidationError(validationMessage);
      this.dispatch(quizFormEvents.check, {
        selected,
        valid: false,
        attempt: this.attempts,
      });
      return;
    }

    this.clearValidationError();
    this.previouslySelected = selected;
    this.attempts += 1;
    this.updateAttemptCount();

    const isCorrect = this.checkCorrectness(selected);
    const canRetry = this.attempts < this.options.maxAttempts;

    this.dispatch(quizFormEvents.check, {
      selected,
      valid: true,
      attempt: this.attempts,
    });

    if (isCorrect) {
      this.setState(STATES.checkedCorrect);
      this.onCorrect();
    } else if (canRetry) {
      this.setState(STATES.checkedWrongRetry);
      this.onWrongRetry();
    } else {
      this.setState(STATES.checkedWrongFinal);
      this.onWrongFinal();
    }
  }

  reveal(): void {
    if (!this.canReveal()) return;

    const wasComplete = this.isCompleteState();
    this.setState(STATES.revealed);
    this.markAnswers();
    this.revealExplanations("all");
    this.announce(this.message("answerRevealed"));
    this.showSummaryText(this.message("summaryRevealed"), !wasComplete);
    if (this.options.disableAfterComplete) this.disableInputs();
    if (this.checkButton) this.checkButton.hidden = true;
    this.hideShowAnswerButton();
    this.showResetButton();
    this.dispatch(quizFormEvents.reveal, {});
    this.dispatchComplete({
      correct: false,
      revealed: true,
      attempt: this.attempts,
    });
  }

  reset(): void {
    if (this.destroyed || this.options.mode === "review" || !this.options.allowReset) {
      return;
    }

    const view = this.form.ownerDocument.defaultView;
    if (this.announceTimer !== undefined) {
      view?.clearTimeout(this.announceTimer);
      this.announceTimer = undefined;
    }

    this.attempts = 0;
    this.previouslySelected = [];
    this.completionEmitted = false;

    for (const input of this.inputs) {
      input.checked = this.initialChecked.get(input) ?? false;
      input.disabled = this.initialDisabled.get(input) ?? false;
    }

    for (const answer of this.answerEls) {
      answer.classList.remove(
        CLASSES.correct,
        CLASSES.incorrect,
        CLASSES.selected,
        CLASSES.previouslySelected,
      );

      const status = answer.querySelector<HTMLElement>(SELECTORS.answerStatus);
      if (status) {
        status.textContent = "";
        status.hidden = true;
      }

      const note = answer.querySelector<HTMLElement>(SELECTORS.answerNote);
      if (note) note.hidden = true;

      const explanation = answer.querySelector<HTMLElement>(SELECTORS.explanation);
      if (explanation) {
        explanation.hidden = this.options.explanationMode !== "all-immediate";
      }
    }

    this.refreshSelectionState();

    if (this.statusEl) this.statusEl.textContent = "";
    if (this.summaryEl) this.summaryEl.hidden = true;
    this.clearValidationError();

    if (this.checkButton) this.checkButton.hidden = false;
    if (this.resetButton) this.resetButton.hidden = true;

    this.setState(STATES.idle);
    this.updateCheckButton();
    this.updateShowAnswerButton();
    this.updateAttemptCount();
    this.syncGroupDescription();
    this.syncInputDescriptions();
    this.dispatch(quizFormEvents.reset, {});
  }

  refresh(options: QuizFormRefreshOptions = {}): void {
    if (this.destroyed) return;

    const preserveSelection = options.preserveSelection === true;
    const previousInputs = [...this.inputs];
    const selectedKeys = preserveSelection
      ? this.inputs.filter((input) => input.checked).map((input) => this.inputKey(input))
      : [];
    const view = this.form.ownerDocument.defaultView;
    const activeElement = this.form.ownerDocument.activeElement;
    const activeWasManaged =
      view !== null &&
      activeElement !== null &&
      activeElement instanceof view.HTMLElement &&
      this.form.contains(activeElement) &&
      activeElement.matches(
        `${SELECTORS.input}, ${SELECTORS.checkButton}, ${SELECTORS.showAnswerButton}, ${SELECTORS.resetButton}`,
      );
    const shouldRestoreRemovedFocus =
      Boolean(this.lastFocusedControl) &&
      !this.lastFocusedControl?.element.isConnected &&
      (activeElement === this.form.ownerDocument.body || activeElement === this.form);

    if (this.announceTimer !== undefined) {
      view?.clearTimeout(this.announceTimer);
      this.announceTimer = undefined;
    }

    this.showAnswerButton?.removeEventListener("click", this.handleShowAnswer);
    this.resetButton?.removeEventListener("click", this.handleReset);
    this.cacheElements();
    this.captureRefreshState();

    if (preserveSelection) {
      const remainingKeys = [...selectedKeys];
      for (const input of this.inputs) {
        const keyIndex = remainingKeys.indexOf(this.inputKey(input));
        input.checked = keyIndex >= 0;
        if (keyIndex >= 0) remainingKeys.splice(keyIndex, 1);
      }
    } else {
      for (const input of this.inputs) {
        input.checked = this.initialChecked.get(input) ?? input.defaultChecked;
      }
    }

    for (const status of this.createdStatusElements) {
      if (!this.answerEls.some((answer) => answer.contains(status))) {
        status.remove();
        this.createdStatusElements.delete(status);
      }
    }

    this.attempts = 0;
    this.previouslySelected = [];
    this.completionEmitted = false;
    this.enhanceAccessibility();
    this.showAnswerButton?.addEventListener("click", this.handleShowAnswer);
    this.resetButton?.addEventListener("click", this.handleReset);
    this.prepareRefreshedRun();

    if (
      shouldRestoreRemovedFocus ||
      (activeWasManaged && this.form.ownerDocument.activeElement !== activeElement)
    ) {
      this.restoreRemovedControlFocus();
    }

    const added = this.inputs.filter((input) => !previousInputs.includes(input)).length;
    const removed = previousInputs.filter((input) => !this.inputs.includes(input)).length;
    this.dispatch(quizFormEvents.refresh, {
      preserveSelection,
      selected: this.getSelectedValues(),
      added,
      removed,
    });
  }

  getState(): QuizFormStateSnapshot {
    return {
      state: this.state,
      attempts: this.attempts,
      maxAttempts: this.options.maxAttempts,
      selected: this.getSelectedValues(),
      correct: this.state === STATES.checkedCorrect,
    };
  }

  destroy(): void {
    if (this.destroyed) return;

    this.form.removeEventListener("submit", this.handleSubmit);
    this.form.removeEventListener("change", this.handleChange);
    this.form.removeEventListener("focusin", this.handleFocusIn);
    this.showAnswerButton?.removeEventListener("click", this.handleShowAnswer);
    this.resetButton?.removeEventListener("click", this.handleReset);

    const view = this.form.ownerDocument.defaultView;
    if (this.announceTimer !== undefined) {
      view?.clearTimeout(this.announceTimer);
      this.announceTimer = undefined;
    }

    this.destroyed = true;
    A11yQuizForm.instances.delete(this.form);
    this.restoreInitialState();
    this.dispatch(quizFormEvents.destroy, {});
  }

  private initialize(): void {
    this.cacheElements();
    this.captureInitialState();
    this.form.classList.add(CLASSES.initialized);
    this.dispatch(quizFormEvents.init, {});
    this.enhanceAccessibility();

    if (this.options.shuffleAnswers) this.shuffleAnswers();

    this.form.addEventListener("submit", this.handleSubmit);
    this.form.addEventListener("change", this.handleChange);
    this.form.addEventListener("focusin", this.handleFocusIn);
    this.showAnswerButton?.addEventListener("click", this.handleShowAnswer);
    this.resetButton?.addEventListener("click", this.handleReset);

    this.applyMode();
    if (this.options.explanationMode === "all-immediate") {
      this.revealExplanations("all");
    }
    this.updateShowAnswerButton();
    this.updateAttemptCount();
    this.refreshSelectionState();
    this.updateCheckButton();

    if (this.state === STATES.idle) this.setState(STATES.idle);
    this.dispatch(quizFormEvents.ready, {});
  }

  private cacheElements(): void {
    this.fieldsetEl = this.form.querySelector<HTMLFieldSetElement>(SELECTORS.fieldset);
    this.statusEl = this.form.querySelector<HTMLElement>(SELECTORS.status);
    this.answersEl = this.form.querySelector<HTMLElement>(SELECTORS.answers);
    this.answerEls = Array.from(this.form.querySelectorAll<HTMLElement>(SELECTORS.answer));
    this.inputs = Array.from(this.form.querySelectorAll<HTMLInputElement>(SELECTORS.input));
    this.checkButton = this.form.querySelector<HTMLButtonElement>(SELECTORS.checkButton);
    this.showAnswerButton = this.form.querySelector<HTMLButtonElement>(
      SELECTORS.showAnswerButton,
    );
    this.resetButton = this.form.querySelector<HTMLButtonElement>(SELECTORS.resetButton);
    this.summaryEl = this.form.querySelector<HTMLElement>(SELECTORS.summary);
    this.attemptsEl = this.form.querySelector<HTMLElement>(SELECTORS.attempts);
    this.validationEl = this.form.querySelector<HTMLElement>(SELECTORS.validation);
    this.progressEl = this.form.querySelector<HTMLElement>(SELECTORS.progress);
  }

  private captureInitialState(): void {
    this.initialAnswerEls = [...this.answerEls];
    this.initialAnswerChildNodes = this.answersEl
      ? Array.from(this.answersEl.childNodes)
      : [];

    this.captureAttributes(this.form, ["class", ATTRIBUTES.state, "tabindex"]);
    this.captureAttributes(this.fieldsetEl, ["id", ATTRIBUTES.describedBy]);
    this.captureAttributes(this.statusEl, [
      "id",
      "role",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "tabindex",
    ]);
    this.captureContent(this.statusEl);
    this.captureAttributes(this.attemptsEl, [
      "id",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "hidden",
    ]);
    this.captureContent(this.attemptsEl);
    this.captureAttributes(this.summaryEl, [
      "id",
      "role",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "tabindex",
      "hidden",
    ]);
    this.captureContent(
      this.summaryEl?.querySelector<HTMLElement>(SELECTORS.summaryText) ?? null,
    );
    this.captureAttributes(this.checkButton, [
      "hidden",
      "disabled",
      ATTRIBUTES.disabled,
    ]);
    this.captureAttributes(this.showAnswerButton, ["hidden"]);
    this.captureAttributes(this.resetButton, ["hidden"]);

    const question = this.form.querySelector<HTMLElement>(SELECTORS.question);
    const instruction = this.form.querySelector<HTMLElement>(SELECTORS.instruction);
    const hint = this.form.querySelector<HTMLElement>(SELECTORS.hint);
    const hintContent = this.form.querySelector<HTMLElement>(SELECTORS.hintContent);
    this.captureAttributes(question, ["id"]);
    this.captureAttributes(instruction, ["id"]);
    this.captureAttributes(hint, ["hidden"]);
    this.captureAttributes(hintContent, ["id"]);

    for (const input of this.inputs) {
      this.initialChecked.set(input, input.checked);
      this.initialDisabled.set(input, input.disabled);
      this.captureAttributes(input, [
        "disabled",
        ATTRIBUTES.describedBy,
        ATTRIBUTES.invalid,
        ATTRIBUTES.errorMessage,
      ]);
    }

    for (const answer of this.answerEls) {
      this.captureAttributes(answer, ["class"]);
      this.captureAttributes(
        answer.querySelector<HTMLElement>(SELECTORS.answerNote),
        ["id", "hidden"],
      );
      this.captureAttributes(
        answer.querySelector<HTMLElement>(SELECTORS.explanation),
        ["id", "hidden"],
      );

      const answerStatus = answer.querySelector<HTMLElement>(SELECTORS.answerStatus);
      this.captureAttributes(answerStatus, ["id", "hidden"]);
      this.captureContent(answerStatus);
    }

    this.captureAttributes(this.validationEl, [
      "id",
      "role",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "hidden",
    ]);
    this.captureContent(this.validationEl);
    this.captureAttributes(this.progressEl, [
      "id",
      "role",
      "aria-valuemin",
      "aria-valuemax",
      "aria-valuenow",
      "aria-valuetext",
      "hidden",
      "style",
    ]);
    this.captureContent(this.progressEl);
  }

  private captureRefreshState(): void {
    this.captureAttributes(this.fieldsetEl, ["id", ATTRIBUTES.describedBy]);
    this.captureAttributes(this.statusEl, [
      "id",
      "role",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "tabindex",
    ]);
    this.captureContent(this.statusEl);
    this.captureAttributes(this.attemptsEl, [
      "id",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "hidden",
    ]);
    this.captureContent(this.attemptsEl);
    this.captureAttributes(this.summaryEl, [
      "id",
      "role",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "tabindex",
      "hidden",
    ]);
    this.captureContent(
      this.summaryEl?.querySelector<HTMLElement>(SELECTORS.summaryText) ?? null,
    );
    this.captureAttributes(this.checkButton, ["hidden", "disabled", ATTRIBUTES.disabled]);
    this.captureAttributes(this.showAnswerButton, ["hidden"]);
    this.captureAttributes(this.resetButton, ["hidden"]);

    const question = this.form.querySelector<HTMLElement>(SELECTORS.question);
    const instruction = this.form.querySelector<HTMLElement>(SELECTORS.instruction);
    const hint = this.form.querySelector<HTMLElement>(SELECTORS.hint);
    const hintContent = this.form.querySelector<HTMLElement>(SELECTORS.hintContent);
    this.captureAttributes(question, ["id"]);
    this.captureAttributes(instruction, ["id"]);
    this.captureAttributes(hint, ["hidden"]);
    this.captureAttributes(hintContent, ["id"]);

    for (const input of this.inputs) {
      if (!this.initialChecked.has(input)) this.initialChecked.set(input, input.checked);
      if (!this.initialDisabled.has(input)) this.initialDisabled.set(input, input.disabled);
      this.captureAttributes(input, [
        "disabled",
        ATTRIBUTES.describedBy,
        ATTRIBUTES.invalid,
        ATTRIBUTES.errorMessage,
      ]);
    }

    for (const answer of this.answerEls) {
      this.captureAttributes(answer, ["class"]);
      this.captureAttributes(
        answer.querySelector<HTMLElement>(SELECTORS.answerNote),
        ["id", "hidden"],
      );
      this.captureAttributes(
        answer.querySelector<HTMLElement>(SELECTORS.explanation),
        ["id", "hidden"],
      );
      const status = answer.querySelector<HTMLElement>(SELECTORS.answerStatus);
      this.captureAttributes(status, ["id", "hidden"]);
      this.captureContent(status);
    }

    this.captureAttributes(this.validationEl, [
      "id",
      "role",
      ATTRIBUTES.live,
      ATTRIBUTES.atomic,
      "hidden",
    ]);
    this.captureContent(this.validationEl);
    this.captureAttributes(this.progressEl, [
      "id",
      "role",
      "aria-valuemin",
      "aria-valuemax",
      "aria-valuenow",
      "aria-valuetext",
      "hidden",
      "style",
    ]);
    this.captureContent(this.progressEl);
  }

  private captureAttributes(
    element: HTMLElement | null,
    attributes: readonly string[],
  ): void {
    if (!element) return;

    let snapshot = this.initialAttributes.get(element);
    if (!snapshot) {
      snapshot = new Map<string, string | null>();
      this.initialAttributes.set(element, snapshot);
    }

    for (const attribute of attributes) {
      if (!snapshot.has(attribute)) {
        snapshot.set(attribute, element.getAttribute(attribute));
      }
    }
  }

  private captureContent(element: HTMLElement | null): void {
    if (!element || this.initialContent.has(element)) return;
    this.initialContent.set(element, Array.from(element.childNodes));
  }

  private restoreInitialState(): void {
    for (const status of this.createdStatusElements) status.remove();
    this.createdValidationEl?.remove();
    this.createdProgressEl?.remove();

    if (this.answersEl) {
      const additionalNodes = Array.from(this.answersEl.childNodes).filter(
        (node) => !this.initialAnswerChildNodes.includes(node),
      );
      this.answersEl.replaceChildren(...this.initialAnswerChildNodes, ...additionalNodes);
      this.answerEls = [...this.initialAnswerEls];
    }

    for (const [element, attributes] of this.initialAttributes) {
      for (const [attribute, value] of attributes) {
        if (value === null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
      }
    }

    for (const [element, childNodes] of this.initialContent) {
      element.replaceChildren(...childNodes);
    }

    for (const input of this.inputs) {
      input.checked = this.initialChecked.get(input) ?? false;
      input.disabled = this.initialDisabled.get(input) ?? false;
    }

    for (const element of this.generatedIdElements) {
      if (!this.initialAttributes.get(element)?.has("id")) {
        element.removeAttribute("id");
      }
    }
  }

  private enhanceAccessibility(): void {
    this.ensureId(this.fieldsetEl, "fieldset");
    this.ensureId(this.statusEl, "status");
    this.ensureId(this.attemptsEl, "attempts");
    this.ensureId(this.summaryEl, "summary");
    this.ensureValidationElement();
    this.ensureProgressElement();

    if (this.statusEl) {
      this.statusEl.setAttribute("role", "status");
      this.statusEl.setAttribute(ATTRIBUTES.live, "polite");
      this.statusEl.setAttribute(ATTRIBUTES.atomic, "true");
    }

    if (this.attemptsEl) {
      this.attemptsEl.setAttribute(ATTRIBUTES.live, "polite");
      this.attemptsEl.setAttribute(ATTRIBUTES.atomic, "true");
    }

    if (this.summaryEl) {
      this.summaryEl.setAttribute("role", "status");
      this.summaryEl.setAttribute(ATTRIBUTES.live, "polite");
      this.summaryEl.setAttribute(ATTRIBUTES.atomic, "true");
      this.summaryEl.setAttribute("tabindex", "-1");
    }

    const question = this.form.querySelector<HTMLElement>(SELECTORS.question);
    const instruction = this.form.querySelector<HTMLElement>(SELECTORS.instruction);
    const hintContent = this.form.querySelector<HTMLElement>(SELECTORS.hintContent);

    this.ensureId(question, "question");
    this.ensureId(instruction, "instruction");
    this.ensureId(hintContent, "hint");

    this.answerEls.forEach((answer, index) => {
      this.ensureId(answer.querySelector<HTMLElement>(SELECTORS.answerNote), `answer-${index}-note`);
      this.ensureId(
        answer.querySelector<HTMLElement>(SELECTORS.explanation),
        `answer-${index}-explanation`,
      );
    });

    this.syncGroupDescription();
    this.syncInputDescriptions();
  }

  private applyMode(): void {
    if (this.options.mode === "exam") {
      const hint = this.form.querySelector<HTMLElement>(SELECTORS.hint);
      if (hint) hint.hidden = true;
      this.syncInputDescriptions();
    } else if (this.options.mode === "review") {
      this.setState(STATES.revealed);
      this.markAnswers();
      this.revealExplanations("all");
      this.disableInputs();
      if (this.checkButton) this.checkButton.hidden = true;
      if (this.showAnswerButton) this.showAnswerButton.hidden = true;
      if (this.resetButton) this.resetButton.hidden = true;
    }
  }

  private onSubmit(event: Event): void {
    event.preventDefault();
    this.check();
  }

  private onChange(event: Event): void {
    const view = this.form.ownerDocument.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.HTMLInputElement) || !target.matches(SELECTORS.input)) {
      return;
    }

    const wasRetrying = this.state === STATES.checkedWrongRetry;
    this.clearValidationError();

    if (this.state === STATES.idle || this.state === STATES.answered || wasRetrying) {
      this.setState(STATES.answered);
    }

    if (wasRetrying) {
      this.clearRetryFeedback();
      this.announce(this.message("answerChanged"));
    }

    this.refreshSelectionState();
    this.updateCheckButton();
    this.syncInputDescriptions();
    this.dispatch(quizFormEvents.change, { selected: this.getSelectedValues() });
  }

  private onFocusIn(event: Event): void {
    const target = event.target;
    const view = this.form.ownerDocument.defaultView;
    if (!view || !(target instanceof view.HTMLElement)) return;

    if (target.matches(SELECTORS.input)) {
      const currentInputs = Array.from(
        this.form.querySelectorAll<HTMLInputElement>(SELECTORS.input),
      );
      this.lastFocusedControl = {
        element: target,
        kind: "input",
        key: this.inputKey(target as HTMLInputElement),
        index: currentInputs.indexOf(target as HTMLInputElement),
      };
    } else if (target.matches(SELECTORS.checkButton)) {
      this.lastFocusedControl = { element: target, kind: "check", key: "", index: 0 };
    } else if (target.matches(SELECTORS.showAnswerButton)) {
      this.lastFocusedControl = { element: target, kind: "show", key: "", index: 0 };
    } else if (target.matches(SELECTORS.resetButton)) {
      this.lastFocusedControl = { element: target, kind: "reset", key: "", index: 0 };
    }
  }

  private onShowAnswer(): void {
    this.reveal();
  }

  private onReset(): void {
    this.reset();
  }

  private prepareRefreshedRun(): void {
    for (const input of this.inputs) {
      input.disabled = this.initialDisabled.get(input) ?? false;
      this.restoreAttribute(input, ATTRIBUTES.invalid);
      this.restoreAttribute(input, ATTRIBUTES.errorMessage);
    }

    for (const answer of this.answerEls) {
      answer.classList.remove(
        CLASSES.correct,
        CLASSES.incorrect,
        CLASSES.selected,
        CLASSES.previouslySelected,
      );
      const status = answer.querySelector<HTMLElement>(SELECTORS.answerStatus);
      if (status) {
        status.textContent = "";
        status.hidden = true;
      }
      const note = answer.querySelector<HTMLElement>(SELECTORS.answerNote);
      if (note) note.hidden = true;
      const explanation = answer.querySelector<HTMLElement>(SELECTORS.explanation);
      if (explanation) {
        explanation.hidden = this.options.explanationMode !== "all-immediate";
      }
    }

    if (this.statusEl) this.statusEl.textContent = "";
    if (this.summaryEl) this.summaryEl.hidden = true;
    if (this.validationEl) {
      this.validationEl.textContent = "";
      this.validationEl.hidden = true;
    }
    if (this.checkButton) this.checkButton.hidden = false;
    if (this.resetButton) this.resetButton.hidden = true;

    if (this.options.mode === "review") {
      this.setState(STATES.revealed);
      this.applyMode();
    } else {
      this.setState(this.getSelectedValues().length > 0 ? STATES.answered : STATES.idle);
      if (this.options.explanationMode === "all-immediate") {
        this.revealExplanations("all");
      }
    }
    this.updateShowAnswerButton();
    this.updateAttemptCount();
    this.refreshSelectionState();
    this.updateCheckButton();
    this.syncGroupDescription();
    this.syncInputDescriptions();
  }

  private inputKey(input: HTMLInputElement): string {
    return `${input.type}\u0000${input.name}\u0000${input.value}`;
  }

  private restoreRemovedControlFocus(): void {
    const previous = this.lastFocusedControl;
    if (!previous) return;

    let target: HTMLElement | null = null;
    if (previous.kind === "input") {
      target =
        this.inputs.find((input) => this.inputKey(input) === previous.key) ??
        this.inputs[Math.min(Math.max(previous.index, 0), this.inputs.length - 1)] ??
        null;
    } else if (previous.kind === "check") {
      target = this.checkButton;
    } else if (previous.kind === "show") {
      target = this.showAnswerButton;
    } else {
      target = this.resetButton;
    }

    const view = this.form.ownerDocument.defaultView;
    const isUnavailable = (element: HTMLElement | null): boolean =>
      !element ||
      element.hidden ||
      Boolean(
        view &&
          ((element instanceof view.HTMLButtonElement && element.disabled) ||
            (element instanceof view.HTMLInputElement && element.disabled)),
      );

    if (isUnavailable(target)) {
      target = this.inputs.find((input) => !input.disabled) ?? this.checkButton;
    }
    if (isUnavailable(target)) {
      this.form.setAttribute("tabindex", "-1");
      target = this.form;
    }
    target?.focus({ preventScroll: true });
  }

  private onCorrect(): void {
    this.announce(this.message("correct"));
    this.markAnswers();
    this.revealExplanationsFor("correct");
    if (this.attempts >= this.options.maxAttempts) {
      this.revealExplanationsFor("final");
    }
    this.showSummaryText(this.message("summaryCorrect"));
    if (this.options.disableAfterComplete) this.disableInputs();
    if (this.checkButton) this.checkButton.hidden = true;
    this.hideShowAnswerButton();
    this.showResetButton();
    this.dispatch(quizFormEvents.correct, { attempt: this.attempts });
    this.dispatchComplete({
      correct: true,
      revealed: false,
      attempt: this.attempts,
    });
  }

  private onWrongRetry(): void {
    this.announce(this.message("incorrectRetry"));
    this.markSelectedAsIncorrect();
    this.markPreviouslySelected();

    this.revealExplanationsFor("wrong");

    this.updateShowAnswerButton();
    this.dispatch(quizFormEvents.incorrect, {
      attempt: this.attempts,
      canRetry: true,
    });
    this.dispatch(quizFormEvents.retry, { attempt: this.attempts });
  }

  private onWrongFinal(): void {
    this.announce(this.message("incorrectFinal"));
    this.markAnswers();
    this.revealExplanationsFor("wrong");
    this.revealExplanationsFor("final");
    this.showSummaryText(this.message("summaryIncorrect"));
    if (this.options.disableAfterComplete) this.disableInputs();
    if (this.checkButton) this.checkButton.hidden = true;
    this.updateShowAnswerButton();
    this.showResetButton();
    this.dispatch(quizFormEvents.incorrect, {
      attempt: this.attempts,
      canRetry: false,
    });
    this.dispatchComplete({
      correct: false,
      revealed: false,
      attempt: this.attempts,
    });
  }

  private refreshSelectionState(): void {
    for (const answer of this.answerEls) {
      const input = answer.querySelector<HTMLInputElement>(SELECTORS.input);
      const isSelected = Boolean(input?.checked);
      answer.classList.toggle(CLASSES.selected, isSelected);

      if (!isSelected && this.state === STATES.answered) {
        answer.classList.remove(CLASSES.correct, CLASSES.incorrect);
      }
    }
  }

  private clearRetryFeedback(): void {
    for (const answer of this.answerEls) {
      answer.classList.remove(CLASSES.correct, CLASSES.incorrect);

      const status = answer.querySelector<HTMLElement>(SELECTORS.answerStatus);
      if (status) {
        status.textContent = "";
        status.hidden = true;
      }

      const explanation = answer.querySelector<HTMLElement>(SELECTORS.explanation);
      if (explanation && this.options.explanationMode !== "all-immediate") {
        explanation.hidden = true;
      }
    }
  }

  private markAnswers(): void {
    const selectedCorrect = this.message("selectedCorrect");
    const correctAnswer = this.message("correctAnswer");
    const selectedIncorrect = this.message("selectedIncorrect");

    for (const answer of this.answerEls) {
      const input = answer.querySelector<HTMLInputElement>(SELECTORS.input);
      const isCorrect = answer.dataset.correct === "true";
      const isSelected = Boolean(input?.checked);

      answer.classList.remove(
        CLASSES.correct,
        CLASSES.incorrect,
        CLASSES.selected,
        CLASSES.previouslySelected,
      );
      if (isSelected) answer.classList.add(CLASSES.selected);

      if (isCorrect) {
        answer.classList.add(CLASSES.correct);
        this.setAnswerStatus(answer, isSelected ? selectedCorrect : correctAnswer);
      } else if (isSelected) {
        answer.classList.add(CLASSES.incorrect, CLASSES.selected);
        this.setAnswerStatus(answer, selectedIncorrect);
      }
    }
  }

  private markSelectedAsIncorrect(): void {
    const selectedIncorrect = this.message("retrySelectedIncorrect");

    for (const answer of this.answerEls) {
      const input = answer.querySelector<HTMLInputElement>(SELECTORS.input);
      if (input?.checked) {
        answer.classList.add(CLASSES.incorrect, CLASSES.selected);
        this.setAnswerStatus(answer, selectedIncorrect);
      }
    }
  }

  private markPreviouslySelected(): void {
    for (const answer of this.answerEls) {
      const input = answer.querySelector<HTMLInputElement>(SELECTORS.input);
      if (input && this.previouslySelected.includes(input.value)) {
        const note = answer.querySelector<HTMLElement>(SELECTORS.answerNote);
        if (note) note.hidden = false;
      }
    }
    this.syncInputDescriptions();
  }

  private setAnswerStatus(answer: HTMLElement, text: string): void {
    let status = answer.querySelector<HTMLElement>(SELECTORS.answerStatus);
    if (!status) {
      status = this.form.ownerDocument.createElement("p");
      status.className = "a11y-quiz__answer-status";
      answer.append(status);
      this.createdStatusElements.add(status);
    }

    this.ensureId(status, `answer-status-${this.answerEls.indexOf(answer)}`);
    status.textContent = text;
    status.hidden = false;
    this.syncInputDescriptions();
  }

  private revealExplanations(mode: "all" | "selected"): void {
    for (const answer of this.answerEls) {
      const explanation = answer.querySelector<HTMLElement>(SELECTORS.explanation);
      if (!explanation) continue;

      if (mode === "all") {
        explanation.hidden = false;
      } else {
        const input = answer.querySelector<HTMLInputElement>(SELECTORS.input);
        if (input?.checked) explanation.hidden = false;
      }
    }
    this.syncInputDescriptions();
  }

  private revealExplanationsFor(trigger: "wrong" | "correct" | "final"): void {
    const mode = this.options.explanationMode;

    if (mode === "all-immediate") {
      this.revealExplanations("all");
    } else if (mode === "selected-after-wrong" && trigger === "wrong") {
      this.revealExplanations("selected");
    } else if (mode === "all-after-correct" && trigger === "correct") {
      this.revealExplanations("all");
    } else if (mode === "all-after-final" && trigger === "final") {
      this.revealExplanations("all");
    }
  }

  private ensureId(element: HTMLElement | null, suffix: string): void {
    if (!element || element.id) return;
    const base = `${this.idPrefix}-${suffix}`;
    let candidate = base;
    let sequence = 2;
    while (this.form.ownerDocument.getElementById(candidate)) {
      candidate = `${base}-${sequence}`;
      sequence += 1;
    }
    element.id = candidate;
    this.generatedIdElements.add(element);
  }

  private isHidden(element: HTMLElement): boolean {
    return element.hidden || Boolean(element.closest("[hidden]"));
  }

  private ensureValidationElement(): void {
    if (!this.validationEl) {
      this.validationEl = this.form.ownerDocument.createElement("p");
      this.validationEl.className = "a11y-quiz__validation";
      this.validationEl.hidden = true;
      this.createdValidationEl = this.validationEl;

      const actions = this.form.querySelector<HTMLElement>(SELECTORS.actions);
      if (actions?.parentNode) actions.parentNode.insertBefore(this.validationEl, actions);
      else this.form.append(this.validationEl);
    }

    this.ensureId(this.validationEl, "validation");
    this.validationEl.setAttribute("role", "alert");
    this.validationEl.setAttribute(ATTRIBUTES.live, "assertive");
    this.validationEl.setAttribute(ATTRIBUTES.atomic, "true");
  }

  private ensureProgressElement(): void {
    if (!this.options.showProgress) {
      if (this.progressEl) this.progressEl.hidden = true;
      return;
    }

    if (!this.progressEl) {
      this.progressEl = this.form.ownerDocument.createElement("p");
      this.progressEl.className = "a11y-quiz__progress";
      this.createdProgressEl = this.progressEl;

      if (this.statusEl?.parentNode) {
        this.statusEl.parentNode.insertBefore(this.progressEl, this.statusEl);
      } else if (this.fieldsetEl) {
        this.fieldsetEl.append(this.progressEl);
      } else {
        this.form.append(this.progressEl);
      }
    }

    this.ensureId(this.progressEl, "progress");
    this.progressEl.setAttribute("role", "progressbar");
    this.progressEl.setAttribute("aria-valuemin", "0");
    this.progressEl.setAttribute("aria-valuemax", String(this.options.maxAttempts));
  }

  private syncGroupDescription(): void {
    if (!this.fieldsetEl) return;

    const pluginDescriptions = this.visibleIds([
      this.form.querySelector<HTMLElement>(SELECTORS.instruction),
      this.form.querySelector<HTMLElement>(SELECTORS.hintContent),
      this.attemptsEl,
      this.statusEl,
      this.summaryEl,
      this.progressEl,
    ]);
    this.syncTokenAttribute(
      this.fieldsetEl,
      ATTRIBUTES.describedBy,
      pluginDescriptions,
    );
  }

  private setValidationError(message: string): void {
    if (this.validationEl) {
      this.validationEl.textContent = message;
      this.validationEl.hidden = false;
    }

    for (const input of this.inputs) {
      input.setAttribute(ATTRIBUTES.invalid, "true");
      if (this.validationEl) {
        input.setAttribute(ATTRIBUTES.errorMessage, this.validationEl.id);
      }
    }
    this.syncGroupDescription();
  }

  private clearValidationError(): void {
    if (this.validationEl) {
      this.validationEl.textContent = "";
      this.validationEl.hidden = true;
    }

    for (const input of this.inputs) {
      this.restoreAttribute(input, ATTRIBUTES.invalid);
      this.restoreAttribute(input, ATTRIBUTES.errorMessage);
    }
    this.syncGroupDescription();
  }

  private syncInputDescriptions(): void {
    const sharedDescriptions = this.visibleIds([
      this.form.querySelector<HTMLElement>(SELECTORS.instruction),
      this.form.querySelector<HTMLElement>(SELECTORS.hintContent),
    ]);

    for (const answer of this.answerEls) {
      const input = answer.querySelector<HTMLInputElement>(SELECTORS.input);
      if (!input) continue;

      const answerDescriptions = this.visibleIds([
        answer.querySelector<HTMLElement>(SELECTORS.answerNote),
        answer.querySelector<HTMLElement>(SELECTORS.answerStatus),
        answer.querySelector<HTMLElement>(SELECTORS.explanation),
      ]);
      this.syncTokenAttribute(input, ATTRIBUTES.describedBy, [
        ...sharedDescriptions,
        ...answerDescriptions,
      ]);
    }
  }

  private syncTokenAttribute(
    element: HTMLElement,
    attribute: string,
    pluginTokens: string[],
  ): void {
    const initialValue = this.initialAttributes.get(element)?.get(attribute);
    const initialTokens = initialValue?.split(/\s+/).filter(Boolean) ?? [];
    const tokens = unique([...initialTokens, ...pluginTokens]);

    if (tokens.length > 0) {
      element.setAttribute(attribute, tokens.join(" "));
    } else if (initialValue !== undefined && initialValue !== null) {
      element.setAttribute(attribute, initialValue);
    } else {
      element.removeAttribute(attribute);
    }
  }

  private restoreAttribute(element: HTMLElement, attribute: string): void {
    const attributes = this.initialAttributes.get(element);
    if (!attributes?.has(attribute)) return;

    const value = attributes.get(attribute);
    if (value === null) element.removeAttribute(attribute);
    else if (value !== undefined) element.setAttribute(attribute, value);
  }

  private visibleIds(elements: Array<HTMLElement | null>): string[] {
    return elements
      .filter((element): element is HTMLElement => Boolean(element && !this.isHidden(element)))
      .map((element) => element.id)
      .filter(Boolean);
  }

  private getSelectedValues(): string[] {
    return this.inputs.filter((input) => input.checked).map((input) => input.value);
  }

  private checkCorrectness(selected: string[]): boolean {
    const correctValues = this.answerEls
      .filter((answer) => answer.dataset.correct === "true")
      .map((answer) => answer.querySelector<HTMLInputElement>(SELECTORS.input))
      .filter((input): input is HTMLInputElement => Boolean(input))
      .map((input) => input.value);
    const selectedValues = new Set(selected);
    const hasWrongSelection = this.answerEls
      .filter((answer) => answer.dataset.correct !== "true")
      .map((answer) => answer.querySelector<HTMLInputElement>(SELECTORS.input))
      .filter((input): input is HTMLInputElement => Boolean(input))
      .some((input) => selectedValues.has(input.value));

    if (this.options.scoringMode === "partial") {
      return !hasWrongSelection && selected.length > 0;
    }

    return (
      selected.length === correctValues.length &&
      !hasWrongSelection &&
      correctValues.every((value) => selectedValues.has(value))
    );
  }

  private disableInputs(): void {
    for (const input of this.inputs) input.disabled = true;
  }

  private announce(message: string): void {
    if (!this.statusEl || !this.options.announceChanges) return;

    const view = this.form.ownerDocument.defaultView;
    if (!view) {
      this.statusEl.textContent = message;
      return;
    }

    if (this.announceTimer !== undefined) view.clearTimeout(this.announceTimer);
    this.statusEl.textContent = "";
    this.syncGroupDescription();
    this.announceTimer = view.setTimeout(() => {
      if (!this.statusEl) return;
      this.statusEl.textContent = message;
      this.announceTimer = undefined;
      this.syncGroupDescription();
    }, 50);
  }

  private showSummaryText(text: string, moveFocus = true): void {
    if (!this.summaryEl) return;
    const textElement = this.summaryEl.querySelector<HTMLElement>(SELECTORS.summaryText);
    if (textElement) textElement.textContent = text;
    this.summaryEl.hidden = false;
    this.syncGroupDescription();
    if (moveFocus && this.options.focusResult) {
      this.summaryEl.focus({ preventScroll: true });
    }
  }

  private updateCheckButton(): void {
    if (!this.checkButton || !this.options.disableCheckUntilAnswered) return;

    const canCheck =
      this.getSelectedValues().length > 0 || this.state === STATES.checkedWrongRetry;
    const completeStates: readonly QuizFormState[] = [
      STATES.checkedCorrect,
      STATES.checkedWrongFinal,
      STATES.revealed,
    ];
    const isComplete = completeStates.includes(this.state);

    this.checkButton.disabled = !canCheck || isComplete;
    this.checkButton.setAttribute(ATTRIBUTES.disabled, String(this.checkButton.disabled));
  }

  private updateShowAnswerButton(): void {
    if (!this.showAnswerButton) return;
    this.showAnswerButton.hidden = !this.shouldShowAnswerButton();
  }

  private hideShowAnswerButton(): void {
    if (this.showAnswerButton) this.showAnswerButton.hidden = true;
  }

  private showResetButton(): void {
    if (this.resetButton && this.options.allowReset) this.resetButton.hidden = false;
  }

  private updateAttemptCount(): void {
    const max = this.options.maxAttempts;

    if (this.attemptsEl) {
      if (max > 1) {
        this.attemptsEl.textContent = this.message("attemptCount");
        this.attemptsEl.hidden = this.attempts === 0;
      } else {
        this.attemptsEl.textContent = "";
        this.attemptsEl.hidden = true;
      }
    }

    if (this.progressEl && this.options.showProgress) {
      const current = Math.min(this.attempts, max);
      const percent = max > 0 ? Math.round((current / max) * 100) : 0;
      this.progressEl.hidden = false;
      this.progressEl.textContent = this.message("progress");
      this.progressEl.style.setProperty("--_progress-percent", `${percent}%`);
      this.progressEl.setAttribute("aria-valuenow", String(current));
      this.progressEl.setAttribute(
        "aria-valuetext",
        this.message("progressValueText"),
      );
    }

    this.syncGroupDescription();
  }

  private shuffleAnswers(): void {
    if (!this.answersEl || this.answerEls.length === 0) return;

    const shuffled = [...this.answerEls];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex] as HTMLElement,
        shuffled[index] as HTMLElement,
      ];
    }

    for (const answer of shuffled) this.answersEl.append(answer);
    this.answerEls = shuffled;
  }

  private setState(state: QuizFormState): void {
    this.state = state;
    this.form.setAttribute(ATTRIBUTES.state, state);
    this.updateCheckButton();
  }

  private canCheck(): boolean {
    return !this.destroyed && this.options.mode !== "review" && !this.isCompleteState();
  }

  private canReveal(): boolean {
    if (this.destroyed || this.options.mode === "review") return false;
    if (this.state === STATES.checkedCorrect || this.state === STATES.revealed) {
      return false;
    }
    if (this.state === STATES.checkedWrongFinal) {
      return this.shouldShowAnswerButton();
    }
    return true;
  }

  private isCompleteState(): boolean {
    return (
      this.state === STATES.checkedCorrect ||
      this.state === STATES.checkedWrongFinal ||
      this.state === STATES.revealed
    );
  }

  private shouldShowAnswerButton(): boolean {
    if (this.destroyed || this.options.mode === "review") return false;

    return (
      (this.options.showAnswerMode === "always" &&
        this.state !== STATES.checkedCorrect &&
        this.state !== STATES.revealed) ||
      (this.options.showAnswerMode === "after-first-wrong" &&
        this.state === STATES.checkedWrongRetry) ||
      (this.options.showAnswerMode === "after-final-attempt" &&
        this.state === STATES.checkedWrongFinal)
    );
  }

  private dispatchComplete(
    detail: QuizFormEventPayloadMap[typeof quizFormEvents.complete],
  ): void {
    if (this.completionEmitted) return;
    this.completionEmitted = true;
    this.dispatch(quizFormEvents.complete, detail);
  }

  private dispatch<K extends QuizFormEventName>(
    name: K,
    detail: QuizFormEventPayloadMap[K],
  ): void {
    const CustomEventConstructor = this.form.ownerDocument.defaultView?.CustomEvent;
    if (!CustomEventConstructor) return;

    const eventDetail = {
      instance: this,
      quiz: this,
      ...detail,
    } as unknown as QuizFormEventDetailMap[K];

    this.form.dispatchEvent(
      new CustomEventConstructor<QuizFormEventDetailMap[K]>(name, {
        bubbles: true,
        composed: false,
        cancelable: false,
        detail: eventDetail,
      }),
    );
  }

  private message(key: QuizFormMessageKey): string {
    const context = Object.freeze({
      attempt: this.attempts,
      maxAttempts: this.options.maxAttempts,
      remainingAttempts: Math.max(this.options.maxAttempts - this.attempts, 0),
    });
    const override = this.resolveMessage(this.options.messages[key], context);
    if (override !== null) return override;

    const fallback = this.resolveMessage(defaultQuizFormMessages[key], context);
    return fallback ?? "Quiz feedback is available.";
  }

  private resolveMessage(
    message: QuizFormMessage,
    context: Readonly<QuizFormMessageContext>,
  ): string | null {
    try {
      const result = typeof message === "function" ? message(context) : message;
      return typeof result === "string" && result.trim().length > 0 ? result : null;
    } catch {
      return null;
    }
  }
}

export function createQuizForm(
  form: HTMLFormElement,
  options: QuizFormOptions = {},
): QuizFormInstance {
  return new A11yQuizForm(form, options);
}

export function initQuizForms(
  options: QuizFormOptions = {},
  root?: ParentNode,
): QuizFormInstance[] {
  const scope = root ?? document;
  return Array.from(scope.querySelectorAll<HTMLFormElement>(SELECTORS.root))
    .filter((element) => element.tagName === "FORM")
    .map((form) => createQuizForm(form, options));
}

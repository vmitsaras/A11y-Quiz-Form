import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  A11yQuizForm,
  createQuizForm,
  defaultQuizFormMessages,
  initQuizForms,
  onQuizFormEvent,
  quizFormEvents,
  type QuizFormEvent,
  type QuizFormInstance,
  type QuizFormOptions,
} from "../src/index.js";

function renderQuiz(attributes = ""): HTMLFormElement {
  document.body.innerHTML = `
    <form class="a11y-quiz" data-a11y-quiz ${attributes} novalidate>
      <fieldset class="a11y-quiz__fieldset">
        <legend class="a11y-quiz__question">Which element performs a form action?</legend>
        <p class="a11y-quiz__instruction">Choose one answer.</p>
        <details class="a11y-quiz__hint">
          <summary>Need a hint?</summary>
          <div class="a11y-quiz__hint-content"><p>Use native semantics.</p></div>
        </details>
        <div class="a11y-quiz__answers">
          <div class="a11y-quiz__answer" data-correct="true">
            <label class="a11y-quiz__answer-label">
              <input class="a11y-quiz__input" type="radio" name="question" value="button">
              <span class="a11y-quiz__answer-text">Button</span>
            </label>
            <p class="a11y-quiz__answer-note" hidden>Previously selected</p>
            <p class="a11y-quiz__explanation" hidden>Buttons have native behavior.</p>
          </div>
          <div class="a11y-quiz__answer" data-correct="false">
            <label class="a11y-quiz__answer-label">
              <input class="a11y-quiz__input" type="radio" name="question" value="div">
              <span class="a11y-quiz__answer-text">Div</span>
            </label>
            <p class="a11y-quiz__answer-note" hidden>Previously selected</p>
            <p class="a11y-quiz__explanation" hidden>Divs are not controls.</p>
          </div>
        </div>
        <p class="a11y-quiz__attempt-count" hidden></p>
        <p class="a11y-quiz__status"></p>
        <div class="a11y-quiz__actions">
          <button type="submit">Check answer</button>
          <button type="button" data-quiz-show-answer hidden>Show correct answer</button>
          <button type="button" data-quiz-reset hidden>Try again</button>
        </div>
        <div class="a11y-quiz__result-summary" hidden>
          <p class="a11y-quiz__result-summary-heading">Result</p>
          <p class="a11y-quiz__result-summary-text"></p>
        </div>
      </fieldset>
    </form>
  `;

  return required<HTMLFormElement>("form");
}

function renderMultipleAnswerQuiz(): HTMLFormElement {
  document.body.innerHTML = `
    <form class="a11y-quiz" data-a11y-quiz data-max-attempts="2">
      <fieldset class="a11y-quiz__fieldset">
        <legend class="a11y-quiz__question">Choose all correct answers.</legend>
        <p class="a11y-quiz__instruction">Choose all that apply.</p>
        <div class="a11y-quiz__answers">
          <div class="a11y-quiz__answer" data-correct="true">
            <label><input class="a11y-quiz__input" type="checkbox" name="multi" value="one">One</label>
            <p class="a11y-quiz__explanation" hidden>One is correct.</p>
          </div>
          <div class="a11y-quiz__answer" data-correct="true">
            <label><input class="a11y-quiz__input" type="checkbox" name="multi" value="two">Two</label>
            <p class="a11y-quiz__explanation" hidden>Two is correct.</p>
          </div>
          <div class="a11y-quiz__answer" data-correct="false">
            <label><input class="a11y-quiz__input" type="checkbox" name="multi" value="wrong">Wrong</label>
            <p class="a11y-quiz__explanation" hidden>This is incorrect.</p>
          </div>
        </div>
        <p class="a11y-quiz__status"></p>
        <div class="a11y-quiz__actions">
          <button type="submit">Check answer</button>
          <button type="button" data-quiz-show-answer hidden>Show answer</button>
          <button type="button" data-quiz-reset hidden>Reset</button>
        </div>
        <div class="a11y-quiz__result-summary" hidden>
          <p class="a11y-quiz__result-summary-text"></p>
        </div>
      </fieldset>
    </form>
  `;

  return required<HTMLFormElement>("form");
}

function required<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing test element: ${selector}`);
  return element;
}

function select(value: string, form: HTMLFormElement): void {
  const input = required<HTMLInputElement>(`input[value="${value}"]`, form);
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("package API", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("exports the class and plugin-specific creation helpers", () => {
    expect(A11yQuizForm).toBeTypeOf("function");
    expect(createQuizForm).toBeTypeOf("function");
    expect(initQuizForms).toBeTypeOf("function");
  });

  it("rejects a non-form root", () => {
    const div = document.createElement("div") as unknown as HTMLFormElement;
    expect(() => new A11yQuizForm(div)).toThrow(/must be a <form>/i);
  });

  it("initializes all declarative quiz forms without auto-initializing on import", () => {
    renderQuiz();
    expect(required("form").classList.contains("is-initialized")).toBe(false);

    const instances = initQuizForms();
    expect(instances).toHaveLength(1);
    expect(required("form").classList.contains("is-initialized")).toBe(true);
  });
});

describe("initialization and options", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("starts idle and disables checking until an answer is selected", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    const checkButton = required<HTMLButtonElement>('[type="submit"]', form);

    expect(quiz.getState()).toMatchObject({ state: "idle", attempts: 0 });
    expect(form.dataset.quizState).toBe("idle");
    expect(checkButton.disabled).toBe(true);
    expect(checkButton.getAttribute("aria-disabled")).toBe("true");

    select("button", form);
    expect(checkButton.disabled).toBe(false);
    expect(checkButton.getAttribute("aria-disabled")).toBe("false");
  });

  it("allows validation before selection when configured", () => {
    const form = renderQuiz('data-disable-check-until-answered="false"');
    createQuizForm(form);
    const checkButton = required<HTMLButtonElement>('[type="submit"]', form);

    expect(checkButton.disabled).toBe(false);
    checkButton.click();

    expect(required<HTMLElement>(".a11y-quiz__validation", form).hidden).toBe(false);
    expect(required<HTMLInputElement>("input", form).getAttribute("aria-invalid")).toBe("true");
  });

  it("reuses the existing instance on duplicate initialization", () => {
    const form = renderQuiz();
    const first = createQuizForm(form);
    const second = new A11yQuizForm(form);

    expect(second).toBe(first);
  });

  it("normalizes invalid dataset values", () => {
    const form = renderQuiz(
      'data-mode="unknown" data-max-attempts="not-a-number" data-allow-reset="maybe"',
    );
    const quiz = new A11yQuizForm(form);

    expect(quiz.options.mode).toBe("practice");
    expect(quiz.options.maxAttempts).toBe(2);
    expect(quiz.options.allowReset).toBe(true);
  });

  it("lets programmatic options override valid dataset options", () => {
    const form = renderQuiz('data-max-attempts="3" data-show-progress="false"');
    const quiz = new A11yQuizForm(form, { maxAttempts: 4, showProgress: true });

    expect(quiz.options.maxAttempts).toBe(4);
    expect(required(".a11y-quiz__progress", form)).toBeTruthy();
  });

  it("adds live-region semantics and programmatic descriptions", () => {
    const form = renderQuiz();
    createQuizForm(form);
    const status = required<HTMLElement>(".a11y-quiz__status", form);
    const instruction = required<HTMLElement>(".a11y-quiz__instruction", form);
    const fieldset = required<HTMLFieldSetElement>("fieldset", form);
    const input = required<HTMLInputElement>("input", form);

    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(fieldset.getAttribute("aria-describedby")).toContain(instruction.id);
    expect(input.getAttribute("aria-describedby")).toContain(instruction.id);
  });
});

describe("quiz interaction", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("shows an associated validation error when checking without a selection", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    quiz.check();

    const validation = required<HTMLElement>(".a11y-quiz__validation", form);
    const input = required<HTMLInputElement>("input", form);
    expect(quiz.getState()).toMatchObject({ state: "idle", attempts: 0 });
    expect(validation.hidden).toBe(false);
    expect(validation.getAttribute("role")).toBe("alert");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-errormessage")).toBe(validation.id);
  });

  it("clears validation when an answer is selected", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    quiz.check();
    select("div", form);

    expect(required<HTMLElement>(".a11y-quiz__validation", form).hidden).toBe(true);
    expect(required<HTMLInputElement>("input", form).hasAttribute("aria-invalid")).toBe(false);
  });

  it("supports a retry with visible, associated feedback", () => {
    const form = renderQuiz('data-max-attempts="2"');
    const quiz = createQuizForm(form);
    select("div", form);
    quiz.check();

    const wrongAnswer = required<HTMLElement>('[data-correct="false"]', form);
    const wrongInput = required<HTMLInputElement>('input[value="div"]', form);
    const status = required<HTMLElement>(".a11y-quiz__answer-status", wrongAnswer);
    const explanation = required<HTMLElement>(".a11y-quiz__explanation", wrongAnswer);

    expect(quiz.getState()).toMatchObject({
      state: "checked-wrong-can-retry",
      attempts: 1,
    });
    expect(status.textContent).toBe("Selected answer: incorrect");
    expect(explanation.hidden).toBe(false);
    expect(wrongInput.getAttribute("aria-describedby")).toContain(status.id);
    expect(required<HTMLButtonElement>("[data-quiz-show-answer]", form).hidden).toBe(false);
  });

  it("clears stale retry feedback after changing the answer", () => {
    const form = renderQuiz('data-max-attempts="2"');
    const quiz = createQuizForm(form);
    select("div", form);
    quiz.check();
    select("button", form);

    const wrongAnswer = required<HTMLElement>('[data-correct="false"]', form);
    expect(quiz.getState().state).toBe("answered");
    expect(wrongAnswer.classList.contains("is-incorrect")).toBe(false);
    expect(required<HTMLElement>(".a11y-quiz__answer-status", wrongAnswer).hidden).toBe(true);
  });

  it("completes with correct feedback", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    select("button", form);
    quiz.check();

    expect(quiz.getState()).toMatchObject({ state: "checked-correct", correct: true });
    expect(required<HTMLElement>('[data-correct="true"]', form).classList).toContain(
      "is-correct",
    );
    expect(required<HTMLButtonElement>('[type="submit"]', form).hidden).toBe(true);
    expect(required<HTMLInputElement>("input", form).disabled).toBe(true);
  });

  it("reveals all explanations in all-after-final mode", () => {
    const form = renderQuiz(
      'data-max-attempts="2" data-explanation-mode="all-after-final"',
    );
    const quiz = createQuizForm(form);
    select("div", form);
    quiz.check();
    quiz.check();

    expect(quiz.getState().state).toBe("checked-wrong-final");
    for (const explanation of form.querySelectorAll<HTMLElement>(".a11y-quiz__explanation")) {
      expect(explanation.hidden).toBe(false);
    }
    expect(required<HTMLButtonElement>("[data-quiz-reset]", form).hidden).toBe(false);
  });

  it.each([
    { mode: "none", visibleAfterWrong: 0 },
    { mode: "selected-after-wrong", visibleAfterWrong: 1 },
    { mode: "all-after-correct", visibleAfterWrong: 0 },
    { mode: "all-after-final", visibleAfterWrong: 0 },
  ] as const)(
    "implements $mode explanation visibility independently",
    ({ mode, visibleAfterWrong }) => {
      const form = renderQuiz(
        `data-max-attempts="2" data-explanation-mode="${mode}"`,
      );
      const quiz = createQuizForm(form);
      select("div", form);
      quiz.check();

      const explanations = Array.from(
        form.querySelectorAll<HTMLElement>(".a11y-quiz__explanation"),
      );
      expect(explanations.filter((explanation) => !explanation.hidden)).toHaveLength(
        visibleAfterWrong,
      );

      select("button", form);
      quiz.check();

      const visibleAfterCorrect = explanations.filter(
        (explanation) => !explanation.hidden,
      );
      expect(visibleAfterCorrect).toHaveLength(
        mode === "all-after-correct" || mode === "all-after-final" ? 2 : 0,
      );
    },
  );

  it("keeps every explanation visible in all-immediate mode, including after reset", () => {
    const form = renderQuiz('data-explanation-mode="all-immediate"');
    const quiz = createQuizForm(form);
    const explanations = Array.from(
      form.querySelectorAll<HTMLElement>(".a11y-quiz__explanation"),
    );

    expect(explanations.every((explanation) => !explanation.hidden)).toBe(true);
    select("div", form);
    quiz.check();
    select("button", form);
    expect(explanations.every((explanation) => !explanation.hidden)).toBe(true);

    quiz.reset();
    expect(explanations.every((explanation) => !explanation.hidden)).toBe(true);
  });

  it.each([
    {
      mode: "always",
      initiallyVisible: true,
      afterRetryVisible: true,
      afterFinalVisible: true,
    },
    {
      mode: "after-first-wrong",
      initiallyVisible: false,
      afterRetryVisible: true,
      afterFinalVisible: false,
    },
    {
      mode: "after-final-attempt",
      initiallyVisible: false,
      afterRetryVisible: false,
      afterFinalVisible: true,
    },
    {
      mode: "never",
      initiallyVisible: false,
      afterRetryVisible: false,
      afterFinalVisible: false,
    },
  ] as const)(
    "implements $mode reveal-button visibility independently",
    ({ mode, initiallyVisible, afterRetryVisible, afterFinalVisible }) => {
      const form = renderQuiz(
        `data-max-attempts="2" data-show-answer-mode="${mode}"`,
      );
      const quiz = createQuizForm(form);
      const revealButton = required<HTMLButtonElement>("[data-quiz-show-answer]", form);

      expect(revealButton.hidden).toBe(!initiallyVisible);
      select("div", form);
      quiz.check();
      expect(revealButton.hidden).toBe(!afterRetryVisible);
      quiz.check();
      expect(revealButton.hidden).toBe(!afterFinalVisible);
    },
  );

  it("keeps after-final-attempt reveal available and emits completion only once", () => {
    const form = renderQuiz(
      'data-max-attempts="1" data-show-answer-mode="after-final-attempt"',
    );
    const complete = vi.fn();
    form.addEventListener("a11yquiz:complete", complete);
    const quiz = createQuizForm(form, { focusResult: true });
    const revealButton = required<HTMLButtonElement>("[data-quiz-show-answer]", form);

    select("div", form);
    quiz.check();
    expect(revealButton.hidden).toBe(false);
    expect(complete).toHaveBeenCalledOnce();

    revealButton.focus();
    revealButton.click();
    expect(quiz.getState().state).toBe("revealed");
    expect(revealButton.hidden).toBe(true);
    expect(complete).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(revealButton);
  });

  it("can reveal and then reset the question", () => {
    const form = renderQuiz('data-show-answer-mode="always"');
    const quiz = createQuizForm(form);
    quiz.reveal();
    expect(quiz.getState().state).toBe("revealed");

    quiz.reset();
    expect(quiz.getState()).toMatchObject({ state: "idle", attempts: 0, selected: [] });
    expect(required<HTMLButtonElement>('[type="submit"]', form).hidden).toBe(false);
    expect(required<HTMLElement>(".a11y-quiz__explanation", form).hidden).toBe(true);
  });

  it("keeps reset unavailable when allowReset is false", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form, { allowReset: false });
    select("button", form);
    quiz.check();

    quiz.reset();
    expect(quiz.getState()).toMatchObject({ state: "checked-correct", attempts: 1 });
    expect(required<HTMLButtonElement>("[data-quiz-reset]", form).hidden).toBe(true);
  });

  it("updates the optional progress indicator", () => {
    const form = renderQuiz('data-show-progress="true" data-max-attempts="2"');
    const quiz = createQuizForm(form);
    const progress = required<HTMLElement>(".a11y-quiz__progress", form);
    expect(progress.getAttribute("aria-valuenow")).toBe("0");

    select("div", form);
    quiz.check();
    expect(progress.getAttribute("aria-valuenow")).toBe("1");
    expect(progress.style.getPropertyValue("--_progress-percent")).toBe("50%");
  });
});

describe("localizable message catalog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("keeps the existing English defaults", () => {
    const context = { attempt: 2, maxAttempts: 3, remainingAttempts: 1 };

    expect(defaultQuizFormMessages.validationRequired).toBe(
      "Please choose an answer before checking.",
    );
    expect(
      typeof defaultQuizFormMessages.correct === "function"
        ? defaultQuizFormMessages.correct(context)
        : defaultQuizFormMessages.correct,
    ).toBe("Correct. You got it on your 2nd try.");
    expect(
      typeof defaultQuizFormMessages.incorrectRetry === "function"
        ? defaultQuizFormMessages.incorrectRetry(context)
        : defaultQuizFormMessages.incorrectRetry,
    ).toBe("Not quite. You have one more try.");
  });

  it("applies partial overrides while missing keys keep their defaults", () => {
    vi.useFakeTimers();
    const form = renderQuiz();
    const quiz = createQuizForm(form, {
      messages: {
        validationRequired: "Elige una respuesta antes de comprobar.",
        correct: ({ attempt }) => `Correcto en el intento ${attempt}.`,
      },
    });

    quiz.check();
    expect(required<HTMLElement>(".a11y-quiz__validation", form).textContent).toBe(
      "Elige una respuesta antes de comprobar.",
    );

    select("button", form);
    quiz.check();
    const liveStatus = required<HTMLElement>(".a11y-quiz__status", form);
    expect(liveStatus.textContent).toBe("");
    vi.advanceTimersByTime(49);
    expect(liveStatus.textContent).toBe("");
    vi.advanceTimersByTime(1);
    expect(liveStatus.textContent).toBe("Correcto en el intento 1.");
    expect(required<HTMLElement>(".a11y-quiz__result-summary-text", form).textContent).toBe(
      "Correct on first attempt.",
    );
    expect(required<HTMLElement>(".a11y-quiz__answer-status", form).textContent).toBe(
      "Your answer: correct",
    );
  });

  it("passes attempt metadata to callbacks and supports localized pluralization", () => {
    vi.useFakeTimers();
    const retryMessage = vi.fn(
      ({ remainingAttempts }: { remainingAttempts: number }) =>
        remainingAttempts === 1
          ? "Queda 1 intento."
          : `Quedan ${remainingAttempts} intentos.`,
    );
    const attemptCount = vi.fn(
      ({ attempt, maxAttempts }: { attempt: number; maxAttempts: number }) =>
        `Intento ${attempt}/${maxAttempts}`,
    );
    const form = renderQuiz();
    const quiz = createQuizForm(form, {
      maxAttempts: 3,
      messages: { incorrectRetry: retryMessage, attemptCount },
    });

    select("div", form);
    quiz.check();
    vi.advanceTimersByTime(50);
    expect(required<HTMLElement>(".a11y-quiz__status", form).textContent).toBe(
      "Quedan 2 intentos.",
    );
    expect(required<HTMLElement>(".a11y-quiz__attempt-count", form).textContent).toBe(
      "Intento 1/3",
    );
    expect(retryMessage).toHaveBeenLastCalledWith({
      attempt: 1,
      maxAttempts: 3,
      remainingAttempts: 2,
    });

    quiz.check();
    vi.advanceTimersByTime(50);
    expect(required<HTMLElement>(".a11y-quiz__status", form).textContent).toBe(
      "Queda 1 intento.",
    );
    expect(retryMessage).toHaveBeenLastCalledWith({
      attempt: 2,
      maxAttempts: 3,
      remainingAttempts: 1,
    });
  });

  it("falls back safely for empty, throwing, invalid, and unknown overrides", () => {
    vi.useFakeTimers();
    const form = renderQuiz();
    const messages = {
      validationRequired: "   ",
      correct: () => {
        throw new Error("Translator callback failed");
      },
      progress: () => "",
      selectedCorrect: 42,
      unknownKey: "Ignored",
    } as unknown as QuizFormOptions["messages"];
    const quiz = createQuizForm(form, { messages, showProgress: true });

    quiz.check();
    expect(required<HTMLElement>(".a11y-quiz__validation", form).textContent).toBe(
      "Please choose an answer before checking.",
    );
    expect(required<HTMLElement>(".a11y-quiz__progress", form).textContent).toBe(
      "Progress: 0 of 2 attempts used.",
    );

    select("button", form);
    quiz.check();
    vi.advanceTimersByTime(50);
    expect(required<HTMLElement>(".a11y-quiz__status", form).textContent).toBe("Correct.");
    expect(required<HTMLElement>(".a11y-quiz__answer-status", form).textContent).toBe(
      "Your answer: correct",
    );
  });

  it("cancels a pending live-region update when reset clears feedback", () => {
    vi.useFakeTimers();
    const form = renderQuiz();
    const quiz = createQuizForm(form, {
      showAnswerMode: "always",
      messages: { answerRevealed: "Respuesta mostrada." },
    });

    quiz.reveal();
    quiz.reset();
    vi.advanceTimersByTime(50);

    expect(required<HTMLElement>(".a11y-quiz__status", form).textContent).toBe("");
  });
});

describe("modes and scoring", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("normalizes exam mode to one attempt without a hint or answer reveal", () => {
    const form = renderQuiz('data-mode="exam" data-max-attempts="5"');
    const quiz = createQuizForm(form);
    expect(quiz.options.maxAttempts).toBe(1);
    expect(required<HTMLElement>(".a11y-quiz__hint", form).hidden).toBe(true);

    select("div", form);
    quiz.check();
    expect(quiz.getState().state).toBe("checked-wrong-final");
    expect(required<HTMLButtonElement>("[data-quiz-show-answer]", form).hidden).toBe(true);
  });

  it("keeps a single-submission exam complete when reset is disabled", () => {
    const form = renderQuiz('data-mode="exam" data-allow-reset="false"');
    const quiz = createQuizForm(form);
    const resetButton = required<HTMLButtonElement>("[data-quiz-reset]", form);

    select("button", form);
    quiz.check();
    expect(quiz.getState().state).toBe("checked-correct");
    expect(resetButton.hidden).toBe(true);

    quiz.reset();
    expect(quiz.getState().state).toBe("checked-correct");
    expect(required<HTMLInputElement>('input[value="button"]', form).checked).toBe(true);
  });

  it("renders review mode as a read-only revealed answer", () => {
    const form = renderQuiz('data-mode="review"');
    const quiz = createQuizForm(form);

    expect(quiz.getState().state).toBe("revealed");
    expect(required<HTMLInputElement>("input", form).disabled).toBe(true);
    expect(required<HTMLButtonElement>('[type="submit"]', form).hidden).toBe(true);
    expect(required<HTMLElement>(".a11y-quiz__explanation", form).hidden).toBe(false);
  });

  it("ignores check, reveal, and reset calls in review mode without moving focus", () => {
    const form = renderQuiz('data-mode="review"');
    const quiz = createQuizForm(form, { focusResult: true });
    const outsideButton = document.createElement("button");
    document.body.append(outsideButton);
    outsideButton.focus();

    quiz.check();
    quiz.reveal();
    quiz.reset();

    expect(quiz.getState()).toMatchObject({ state: "revealed", attempts: 0 });
    expect(required<HTMLInputElement>("input", form).disabled).toBe(true);
    expect(required<HTMLButtonElement>('[type="submit"]', form).hidden).toBe(true);
    expect(document.activeElement).toBe(outsideButton);
  });

  it("requires every correct checkbox and no incorrect checkbox in exact mode", () => {
    const form = renderMultipleAnswerQuiz();
    const quiz = createQuizForm(form);
    select("one", form);
    quiz.check();
    expect(quiz.getState().state).toBe("checked-wrong-can-retry");

    quiz.reset();
    select("one", form);
    select("two", form);
    quiz.check();
    expect(quiz.getState().state).toBe("checked-correct");
  });

  it("accepts a non-empty correct subset in partial mode", () => {
    const form = renderMultipleAnswerQuiz();
    const quiz = createQuizForm(form, { scoringMode: "partial" });
    select("one", form);
    quiz.check();

    expect(quiz.getState().state).toBe("checked-correct");
  });

  it("rejects a partial-mode subset when it includes an incorrect option", () => {
    const form = renderMultipleAnswerQuiz();
    const quiz = createQuizForm(form, { scoringMode: "partial" });
    select("one", form);
    select("wrong", form);
    quiz.check();

    expect(quiz.getState().state).toBe("checked-wrong-can-retry");
  });

  it("treats all-or-nothing as an alias of exact scoring", () => {
    const form = renderMultipleAnswerQuiz();
    const quiz = createQuizForm(form, { scoringMode: "all-or-nothing" });
    select("one", form);
    quiz.check();
    expect(quiz.getState().state).toBe("checked-wrong-can-retry");

    quiz.reset();
    select("one", form);
    select("two", form);
    quiz.check();
    expect(quiz.getState().state).toBe("checked-correct");
  });
});

describe("dynamic-content refresh", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  function createDynamicAnswer(value: string, correct = false): HTMLElement {
    const answer = document.createElement("div");
    answer.className = "a11y-quiz__answer";
    answer.dataset.correct = String(correct);
    answer.innerHTML = `
      <label>
        <input class="a11y-quiz__input" type="radio" name="question" value="${value}">
        ${value}
      </label>
      <p class="a11y-quiz__answer-note" hidden>Previously selected</p>
      <p class="a11y-quiz__explanation" hidden>${value} explanation.</p>
    `;
    return answer;
  }

  it("rebuilds dynamic descriptions, migrates selection, and emits only refresh", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form, {
      announceChanges: false,
      explanationMode: "all-immediate",
    });
    const refreshEvents: Array<QuizFormEvent<typeof quizFormEvents.refresh>> = [];
    const changes = vi.fn();
    const status = required<HTMLElement>(".a11y-quiz__status", form);
    onQuizFormEvent(form, quizFormEvents.refresh, (event) => refreshEvents.push(event));
    form.addEventListener(quizFormEvents.change, changes);
    select("div", form);
    changes.mockClear();

    required<HTMLElement>('[data-correct="false"]', form).remove();
    required<HTMLElement>(".a11y-quiz__answers", form).append(
      createDynamicAnswer("div"),
      createDynamicAnswer("span"),
    );
    quiz.refresh({ preserveSelection: true });

    const migrated = required<HTMLInputElement>('input[value="div"]', form);
    const explanation = migrated
      .closest(".a11y-quiz__answer")
      ?.querySelector<HTMLElement>(".a11y-quiz__explanation");
    expect(migrated.checked).toBe(true);
    expect(quiz.getState()).toMatchObject({ state: "answered", attempts: 0, selected: ["div"] });
    expect(migrated.getAttribute("aria-describedby")).toContain(explanation?.id);
    expect(status.textContent).toBe("");
    expect(changes).not.toHaveBeenCalled();
    expect(refreshEvents).toHaveLength(1);
    expect(refreshEvents[0]?.detail).toMatchObject({
      preserveSelection: true,
      selected: ["div"],
      added: 2,
      removed: 1,
    });
  });

  it("moves focus to the nearest remaining answer when the active control was removed", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    const removedInput = required<HTMLInputElement>('input[value="div"]', form);
    removedInput.focus();
    removedInput.closest(".a11y-quiz__answer")?.remove();

    quiz.refresh({ preserveSelection: true });

    expect(document.activeElement).toBe(required('input[value="button"]', form));
  });

  it("creates collision-safe IDs and keeps repeated refreshes idempotent", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    const answers = required<HTMLElement>(".a11y-quiz__answers", form);
    answers.prepend(createDynamicAnswer("new"));

    quiz.refresh();
    const idsAfterFirst = Array.from(form.querySelectorAll<HTMLElement>("[id]"), ({ id }) => id);
    quiz.refresh();
    const idsAfterSecond = Array.from(form.querySelectorAll<HTMLElement>("[id]"), ({ id }) => id);

    expect(new Set(idsAfterFirst).size).toBe(idsAfterFirst.length);
    expect(idsAfterSecond).toEqual(idsAfterFirst);
    for (const input of form.querySelectorAll<HTMLInputElement>(".a11y-quiz__input")) {
      for (const id of input.getAttribute("aria-describedby")?.split(/\s+/) ?? []) {
        expect(form.ownerDocument.getElementById(id)).not.toBeNull();
      }
    }
  });

  it("restores refreshed author markup during destroy and ignores refresh afterward", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    required<HTMLElement>(".a11y-quiz__validation", form).remove();
    const authorValidation = document.createElement("p");
    authorValidation.className = "a11y-quiz__validation";
    authorValidation.textContent = "Author validation";
    required<HTMLElement>(".a11y-quiz__actions", form).before(authorValidation);
    const answer = createDynamicAnswer("dynamic");
    const input = required<HTMLInputElement>("input", answer);
    input.setAttribute("aria-describedby", "author-help");
    required<HTMLElement>(".a11y-quiz__answers", form).append(answer);
    const refresh = vi.fn();
    form.addEventListener(quizFormEvents.refresh, refresh);

    quiz.refresh();
    expect(answer.querySelector(".a11y-quiz__explanation")?.id).not.toBe("");
    quiz.destroy();
    quiz.refresh({ preserveSelection: true });

    expect(answer.isConnected).toBe(true);
    expect(answer.querySelector(".a11y-quiz__explanation")?.hasAttribute("id")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe("author-help");
    expect(authorValidation.isConnected).toBe(true);
    expect(authorValidation.textContent).toBe("Author validation");
    expect(refresh).toHaveBeenCalledOnce();
  });
});

describe("lifecycle events and cleanup", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("exports frozen lifecycle event constants with stable names", () => {
    expect(Object.isFrozen(quizFormEvents)).toBe(true);
    expect(quizFormEvents).toEqual({
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
  });

  it("preserves event targets, options, details, and synchronous ordering", () => {
    const form = renderQuiz();
    const eventDetails = {
      [quizFormEvents.init]: undefined,
      [quizFormEvents.ready]: undefined,
      [quizFormEvents.change]: undefined,
      [quizFormEvents.check]: undefined,
      [quizFormEvents.correct]: undefined,
      [quizFormEvents.incorrect]: undefined,
      [quizFormEvents.retry]: undefined,
      [quizFormEvents.reveal]: undefined,
      [quizFormEvents.reset]: undefined,
      [quizFormEvents.refresh]: undefined,
      [quizFormEvents.complete]: undefined,
      [quizFormEvents.destroy]: undefined,
    };
    const events: Array<QuizFormEvent<keyof typeof eventDetails>> = [];

    for (const name of Object.keys(eventDetails) as Array<keyof typeof eventDetails>) {
      form.addEventListener(name, (event) => {
        events.push(event as QuizFormEvent<typeof name>);
      });
    }

    const quiz = createQuizForm(form);
    select("div", form);
    quiz.check();
    select("button", form);
    quiz.check();
    quiz.reset();
    quiz.reveal();
    quiz.destroy();

    expect(events.map(({ type }) => type)).toEqual([
      quizFormEvents.init,
      quizFormEvents.ready,
      quizFormEvents.change,
      quizFormEvents.check,
      quizFormEvents.incorrect,
      quizFormEvents.retry,
      quizFormEvents.change,
      quizFormEvents.check,
      quizFormEvents.correct,
      quizFormEvents.complete,
      quizFormEvents.reset,
      quizFormEvents.reveal,
      quizFormEvents.complete,
      quizFormEvents.destroy,
    ]);

    for (const event of events) {
      expect(event.target).toBe(form);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(false);
      expect(event.cancelable).toBe(false);
      expect(event.detail.instance).toBe(quiz);
      expect(event.detail.quiz).toBe(quiz);
    }

    const checks = events.filter(
      (event): event is QuizFormEvent<typeof quizFormEvents.check> =>
        event.type === quizFormEvents.check,
    );
    expect(checks.map(({ detail }) => detail)).toMatchObject([
      { selected: ["div"], valid: true, attempt: 1 },
      { selected: ["button"], valid: true, attempt: 2 },
    ]);

    const changes = events.filter(
      (event): event is QuizFormEvent<typeof quizFormEvents.change> =>
        event.type === quizFormEvents.change,
    );
    expect(changes.map(({ detail }) => detail.selected)).toEqual([
      ["div"],
      ["button"],
    ]);

    const incorrect = events.find(
      (event): event is QuizFormEvent<typeof quizFormEvents.incorrect> =>
        event.type === quizFormEvents.incorrect,
    );
    expect(incorrect?.detail).toMatchObject({ attempt: 1, canRetry: true });

    const retry = events.find(
      (event): event is QuizFormEvent<typeof quizFormEvents.retry> =>
        event.type === quizFormEvents.retry,
    );
    expect(retry?.detail).toMatchObject({ attempt: 1 });

    const correct = events.find(
      (event): event is QuizFormEvent<typeof quizFormEvents.correct> =>
        event.type === quizFormEvents.correct,
    );
    expect(correct?.detail).toMatchObject({ attempt: 2 });

    const completions = events.filter(
      (event): event is QuizFormEvent<typeof quizFormEvents.complete> =>
        event.type === quizFormEvents.complete,
    );
    expect(completions.map(({ detail }) => detail)).toMatchObject([
      { correct: true, revealed: false, attempt: 2 },
      { correct: false, revealed: true, attempt: 0 },
    ]);

    for (const name of [
      quizFormEvents.init,
      quizFormEvents.ready,
      quizFormEvents.reveal,
      quizFormEvents.reset,
      quizFormEvents.destroy,
    ]) {
      const event = events.find((candidate) => candidate.type === name);
      expect(Object.keys(event?.detail ?? {}).sort()).toEqual(["instance", "quiz"]);
    }
  });

  it("reports unchanged attempt counts for invalid checks", () => {
    const form = renderQuiz();
    const checks: Array<QuizFormEvent<typeof quizFormEvents.check>> = [];
    onQuizFormEvent(form, quizFormEvents.check, (event) => checks.push(event));
    const quiz = createQuizForm(form);

    quiz.check();

    expect(checks).toHaveLength(1);
    expect(checks[0]?.detail).toMatchObject({
      selected: [],
      valid: false,
      attempt: 0,
    });
    expect(Object.keys(checks[0]?.detail ?? {}).sort()).toEqual([
      "attempt",
      "instance",
      "quiz",
      "selected",
      "valid",
    ]);
  });

  it("emits one completion before a permitted post-completion reveal", () => {
    const form = renderQuiz('data-max-attempts="1" data-show-answer-mode="after-final-attempt"');
    const sequence: string[] = [];
    const completions: Array<QuizFormEvent<typeof quizFormEvents.complete>> = [];
    const incorrectEvents: Array<
      QuizFormEvent<typeof quizFormEvents.incorrect>
    > = [];

    for (const name of [
      quizFormEvents.check,
      quizFormEvents.incorrect,
      quizFormEvents.complete,
      quizFormEvents.reveal,
    ] as const) {
      form.addEventListener(name, (event) => sequence.push(event.type));
    }
    onQuizFormEvent(form, quizFormEvents.complete, (event) => completions.push(event));
    onQuizFormEvent(form, quizFormEvents.incorrect, (event) =>
      incorrectEvents.push(event),
    );

    const quiz = createQuizForm(form);
    select("div", form);
    quiz.check();
    quiz.reveal();

    expect(sequence).toEqual([
      quizFormEvents.check,
      quizFormEvents.incorrect,
      quizFormEvents.complete,
      quizFormEvents.reveal,
    ]);
    expect(completions).toHaveLength(1);
    expect(completions[0]?.detail).toMatchObject({
      correct: false,
      revealed: false,
      attempt: 1,
    });
    expect(incorrectEvents[0]?.detail).toMatchObject({
      attempt: 1,
      canRetry: false,
    });
  });

  it("provides delegated typed subscriptions with idempotent cleanup", () => {
    const ready = vi.fn<(event: QuizFormEvent<typeof quizFormEvents.ready>) => void>();
    const unsubscribe = onQuizFormEvent(document, quizFormEvents.ready, ready);

    createQuizForm(renderQuiz());
    expect(ready).toHaveBeenCalledOnce();

    unsubscribe();
    unsubscribe();
    createQuizForm(renderQuiz());
    expect(ready).toHaveBeenCalledOnce();
  });

  it("supports abort-signal cleanup in typed subscriptions", () => {
    const form = renderQuiz();
    const controller = new window.AbortController();
    const change = vi.fn();
    onQuizFormEvent(form, quizFormEvents.change, change, {
      signal: controller.signal,
    });
    createQuizForm(form);

    select("div", form);
    controller.abort();
    select("button", form);

    expect(change).toHaveBeenCalledOnce();
  });

  it("infers event details and rejects mismatched typed listeners", () => {
    const form = renderQuiz();
    const unsubscribe = onQuizFormEvent(form, quizFormEvents.check, (event) => {
      const name: typeof quizFormEvents.check = event.type;
      const target: HTMLFormElement = event.target;
      const valid: boolean = event.detail.valid;
      const selected: readonly string[] = event.detail.selected;
      expect(name).toBe(quizFormEvents.check);
      expect(target).toBe(form);
      expect(valid).toBe(false);
      expect(selected).toEqual([]);
    });

    // @ts-expect-error Unknown lifecycle event names are rejected.
    onQuizFormEvent(form, "a11yquiz:unknown", () => undefined);
    const completeListener = (
      _event: QuizFormEvent<typeof quizFormEvents.complete>,
    ): void => undefined;
    // @ts-expect-error A complete-event listener cannot be registered for check events.
    onQuizFormEvent(form, quizFormEvents.check, completeListener);

    createQuizForm(form).check();
    unsubscribe();
  });

  it("dispatches bubbling lifecycle events with the instance", () => {
    const form = renderQuiz();
    const ready = vi.fn();
    const complete = vi.fn();
    document.addEventListener("a11yquiz:ready", ready);
    document.addEventListener("a11yquiz:complete", complete);

    const quiz = createQuizForm(form);
    select("button", form);
    quiz.check();

    expect(ready).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledOnce();
    expect((complete.mock.calls[0]?.[0] as CustomEvent).detail.instance).toBe(quiz);

    document.removeEventListener("a11yquiz:ready", ready);
    document.removeEventListener("a11yquiz:complete", complete);
  });

  it("ignores repeated checks after completion without duplicate events or focus movement", () => {
    const form = renderQuiz();
    const complete = vi.fn();
    const check = vi.fn();
    form.addEventListener("a11yquiz:complete", complete);
    form.addEventListener("a11yquiz:check", check);
    const quiz = createQuizForm(form, { focusResult: true });
    select("button", form);
    quiz.check();

    const outsideButton = document.createElement("button");
    document.body.append(outsideButton);
    outsideButton.focus();
    quiz.check();
    quiz.reveal();

    expect(quiz.getState()).toMatchObject({ state: "checked-correct", attempts: 1 });
    expect(check).toHaveBeenCalledOnce();
    expect(complete).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(outsideButton);
  });

  it("restores each answer input's initial disabled state on reset", () => {
    const form = renderQuiz('data-show-answer-mode="always"');
    const initiallyDisabled = required<HTMLInputElement>('input[value="button"]', form);
    const initiallyEnabled = required<HTMLInputElement>('input[value="div"]', form);
    initiallyDisabled.disabled = true;
    const quiz = createQuizForm(form);

    quiz.reveal();
    expect(initiallyDisabled.disabled).toBe(true);
    expect(initiallyEnabled.disabled).toBe(true);

    quiz.reset();
    expect(initiallyDisabled.disabled).toBe(true);
    expect(initiallyEnabled.disabled).toBe(false);
  });

  it("restores the initial checked answer on reset", () => {
    const form = renderQuiz();
    const initialAnswer = required<HTMLInputElement>('input[value="button"]', form);
    const otherAnswer = required<HTMLInputElement>('input[value="div"]', form);
    initialAnswer.checked = true;
    const quiz = createQuizForm(form);

    select("div", form);
    expect(initialAnswer.checked).toBe(false);
    expect(otherAnswer.checked).toBe(true);

    quiz.reset();
    expect(initialAnswer.checked).toBe(true);
    expect(otherAnswer.checked).toBe(false);
  });

  it("merges author descriptions and restores author validation ARIA", () => {
    const form = renderQuiz();
    const fieldset = required<HTMLFieldSetElement>("fieldset", form);
    const input = required<HTMLInputElement>('input[value="button"]', form);
    const authorGroupDescription = document.createElement("p");
    authorGroupDescription.id = "author-group-description";
    const authorInputDescription = document.createElement("p");
    authorInputDescription.id = "author-input-description";
    form.append(authorGroupDescription, authorInputDescription);
    fieldset.setAttribute("aria-describedby", authorGroupDescription.id);
    input.setAttribute("aria-describedby", authorInputDescription.id);
    input.setAttribute("aria-invalid", "false");
    input.setAttribute("aria-errormessage", "author-error");

    const quiz = createQuizForm(form);
    const instruction = required<HTMLElement>(".a11y-quiz__instruction", form);
    const fieldsetDescriptions = fieldset.getAttribute("aria-describedby")?.split(/\s+/);
    const inputDescriptions = input.getAttribute("aria-describedby")?.split(/\s+/);

    expect(fieldsetDescriptions).toContain(authorGroupDescription.id);
    expect(fieldsetDescriptions).toContain(instruction.id);
    expect(inputDescriptions).toContain(authorInputDescription.id);
    expect(inputDescriptions).toContain(instruction.id);
    expect(new Set(fieldsetDescriptions).size).toBe(fieldsetDescriptions?.length);
    expect(new Set(inputDescriptions).size).toBe(inputDescriptions?.length);

    quiz.check();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    select("button", form);
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-errormessage")).toBe("author-error");

    quiz.destroy();
    expect(fieldset.getAttribute("aria-describedby")).toBe(authorGroupDescription.id);
    expect(input.getAttribute("aria-describedby")).toBe(authorInputDescription.id);
    expect(instruction.hasAttribute("id")).toBe(false);
  });

  it("restores exact author state and answer order after interaction", () => {
    const form = renderQuiz('data-quiz-state="author-state"');
    form.classList.add("is-initialized", "author-root-state");

    const fieldset = required<HTMLFieldSetElement>("fieldset", form);
    const answers = required<HTMLElement>(".a11y-quiz__answers", form);
    const answerElements = Array.from(
      answers.querySelectorAll<HTMLElement>(".a11y-quiz__answer"),
    );
    const firstInput = required<HTMLInputElement>('input[value="button"]', form);
    const secondInput = required<HTMLInputElement>('input[value="div"]', form);
    const status = required<HTMLElement>(".a11y-quiz__status", form);
    const attempts = required<HTMLElement>(".a11y-quiz__attempt-count", form);
    const summary = required<HTMLElement>(".a11y-quiz__result-summary", form);
    const summaryText = required<HTMLElement>(".a11y-quiz__result-summary-text", form);
    const checkButton = required<HTMLButtonElement>('[type="submit"]', form);
    const showAnswerButton = required<HTMLButtonElement>("[data-quiz-show-answer]", form);
    const actions = required<HTMLElement>(".a11y-quiz__actions", form);

    const authorGroupDescription = document.createElement("p");
    authorGroupDescription.id = "author-group";
    authorGroupDescription.textContent = "Author group help";
    fieldset.append(authorGroupDescription);
    fieldset.setAttribute("aria-describedby", authorGroupDescription.id);

    firstInput.checked = true;
    firstInput.disabled = true;
    firstInput.setAttribute("aria-describedby", "author-input");
    firstInput.setAttribute("aria-invalid", "false");
    firstInput.setAttribute("aria-errormessage", "author-validation");
    answerElements[0]?.classList.add("is-correct", "author-answer-state");

    status.setAttribute("role", "log");
    status.setAttribute("aria-live", "assertive");
    status.setAttribute("aria-atomic", "false");
    status.setAttribute("tabindex", "0");
    status.innerHTML = "<strong>Author status</strong>";
    const authorStatusNode = status.firstChild;

    attempts.setAttribute("hidden", "until-found");
    attempts.setAttribute("aria-live", "assertive");
    attempts.setAttribute("aria-atomic", "false");
    attempts.innerHTML = "<span>Author attempt text</span>";

    summary.setAttribute("hidden", "until-found");
    summary.setAttribute("role", "region");
    summary.setAttribute("aria-live", "off");
    summary.setAttribute("aria-atomic", "false");
    summary.setAttribute("tabindex", "0");
    summaryText.innerHTML = "<em>Author summary</em>";

    const validation = document.createElement("p");
    validation.className = "a11y-quiz__validation";
    validation.id = "author-validation";
    validation.setAttribute("role", "note");
    validation.setAttribute("aria-live", "off");
    validation.setAttribute("aria-atomic", "false");
    validation.setAttribute("hidden", "until-found");
    validation.innerHTML = "<strong>Author validation</strong>";
    actions.before(validation);

    const progress = document.createElement("p");
    progress.className = "a11y-quiz__progress";
    progress.id = "author-progress";
    progress.setAttribute("role", "meter");
    progress.setAttribute("aria-valuemin", "2");
    progress.setAttribute("aria-valuemax", "8");
    progress.setAttribute("aria-valuenow", "4");
    progress.setAttribute("aria-valuetext", "Author progress");
    progress.setAttribute("hidden", "until-found");
    progress.setAttribute("style", "color: rebeccapurple");
    progress.innerHTML = "<span>Author progress text</span>";
    status.before(progress);

    const existingAnswerStatus = document.createElement("p");
    existingAnswerStatus.className = "a11y-quiz__answer-status";
    existingAnswerStatus.id = "author-answer-status";
    existingAnswerStatus.setAttribute("hidden", "until-found");
    existingAnswerStatus.innerHTML = "<span>Author answer status</span>";
    answerElements[1]?.append(existingAnswerStatus);

    checkButton.disabled = true;
    checkButton.setAttribute("aria-disabled", "true");
    showAnswerButton.hidden = false;

    const initialDom = form.cloneNode(true);
    const initialAnswerChildNodes = Array.from(answers.childNodes);
    vi.spyOn(Math, "random").mockReturnValue(0);

    let restoredBeforeDestroyEvent = false;
    form.addEventListener("a11yquiz:destroy", () => {
      restoredBeforeDestroyEvent =
        form.isEqualNode(initialDom) && status.firstChild === authorStatusNode;
    });

    const quiz = createQuizForm(form, {
      showAnswerMode: "always",
      showProgress: true,
      shuffleAnswers: true,
    });

    expect(Array.from(answers.querySelectorAll(".a11y-quiz__answer"))).toEqual([
      answerElements[1],
      answerElements[0],
    ]);
    select("div", form);
    quiz.check();
    quiz.reveal();
    quiz.destroy();

    expect(form.isEqualNode(initialDom)).toBe(true);
    expect(Array.from(answers.childNodes)).toEqual(initialAnswerChildNodes);
    expect(firstInput.checked).toBe(true);
    expect(firstInput.disabled).toBe(true);
    expect(secondInput.checked).toBe(false);
    expect(status.firstChild).toBe(authorStatusNode);
    expect(restoredBeforeDestroyEvent).toBe(true);

    const second = createQuizForm(form, { showProgress: true, shuffleAnswers: true });
    second.destroy();
    expect(form.isEqualNode(initialDom)).toBe(true);
  });

  it("removes listeners and state classes in destroy()", () => {
    const form = renderQuiz();
    const quiz = createQuizForm(form);
    const destroyed = vi.fn();
    form.addEventListener("a11yquiz:destroy", destroyed);

    expect(() => quiz.destroy()).not.toThrow();
    expect(form.classList.contains("is-initialized")).toBe(false);
    expect(form.hasAttribute("data-quiz-state")).toBe(false);
    expect(form.querySelector(".a11y-quiz__validation")).toBeNull();
    expect(destroyed).toHaveBeenCalledOnce();

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(quiz.getState().attempts).toBe(0);
  });

  it("allows a fresh instance after destroy()", () => {
    const form = renderQuiz();
    const first = createQuizForm(form);
    first.destroy();
    const second: QuizFormInstance = createQuizForm(form);

    expect(second).not.toBe(first);
    expect(form.classList.contains("is-initialized")).toBe(true);
  });

  it("makes public mutating methods inert after destroy()", () => {
    const form = renderQuiz('data-show-answer-mode="always"');
    const complete = vi.fn();
    const reveal = vi.fn();
    const reset = vi.fn();
    form.addEventListener("a11yquiz:complete", complete);
    form.addEventListener("a11yquiz:reveal", reveal);
    form.addEventListener("a11yquiz:reset", reset);
    const quiz = createQuizForm(form, { focusResult: true });
    const outsideButton = document.createElement("button");
    document.body.append(outsideButton);

    quiz.destroy();
    outsideButton.focus();
    quiz.check();
    quiz.reveal();
    quiz.reset();

    expect(quiz.getState()).toMatchObject({ state: "idle", attempts: 0 });
    expect(complete).not.toHaveBeenCalled();
    expect(reveal).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(outsideButton);
  });
});

export interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo?: string;
  npm?: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: string;
  selectors?: string[];
  keyboard?: Array<{
    key: string;
    description: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  events?: Array<{
    name: string;
    description: string;
    detail: string[];
    target: "form";
    bubbles: boolean;
    composed: boolean;
    cancelable: boolean;
  }>;
  examples?: Array<{
    name: string;
    description: string;
    path: string;
  }>;
}

export const docs = {
  slug: "a11y-quiz-form",
  name: "A11y Quiz Form",
  packageName: "a11y-quiz-form",
  description:
    "Accessible single- and multiple-answer quiz behavior for progressively enhanced native forms.",
  repo: "https://github.com/vmitsaras/A11y-Quiz-Form",
  install: {
    npm: "npm install a11y-quiz-form",
    pnpm: "pnpm add a11y-quiz-form",
    yarn: "yarn add a11y-quiz-form",
  },
  usage: `import { createQuizForm } from "a11y-quiz-form";
import "a11y-quiz-form/styles.css";

const form = document.querySelector("[data-a11y-quiz]");

if (form instanceof HTMLFormElement) {
  createQuizForm(form, {
    maxAttempts: 2,
    messages: {
      validationRequired: "Choose at least one answer.",
      correct: ({ attempt }) => \`Correct on attempt \${attempt}.\`,
    },
  });
}`,
  selectors: [
    "[data-a11y-quiz]",
    ".js-a11y-quiz",
    ".a11y-quiz__fieldset",
    ".a11y-quiz__answer",
    ".a11y-quiz__input",
    ".a11y-quiz__status",
    ".a11y-quiz__result-summary",
    ".a11y-quiz__attempt-count",
    "[data-correct=\"true\"]",
    "[data-quiz-show-answer]",
    "[data-quiz-reset]",
    "[data-quiz-state]",
  ],
  keyboard: [
    {
      key: "Tab / Shift+Tab",
      description: "Moves through the native form controls and action buttons.",
    },
    {
      key: "Arrow keys",
      description: "Moves the selection within a native radio-button group.",
    },
    {
      key: "Space",
      description: "Selects a focused answer or activates a focused button.",
    },
    {
      key: "Enter",
      description: "Submits the native form or activates a focused button.",
    },
  ],
  api: [
    {
      name: "A11yQuizForm",
      type: "new (form: HTMLFormElement, options?: QuizFormOptions) => QuizFormInstance",
      description: "Class-based creation API; use createQuizForm() for the usual functional entry point.",
    },
    {
      name: "createQuizForm(form, options)",
      type: "(form: HTMLFormElement, options?: QuizFormOptions) => QuizFormInstance",
      description: "Enhances one native quiz form and reuses an existing instance safely.",
    },
    {
      name: "initQuizForms(options, root)",
      type: "(options?: QuizFormOptions, root?: ParentNode) => QuizFormInstance[]",
      description: "Enhances every quiz form inside a document or another parent node.",
    },
    {
      name: "QuizFormOptions",
      type: "interface",
      description: "Configuration for modes, attempts, explanation and reveal behavior, scoring, focus, announcements, answer order, progress, reset, and generated messages.",
    },
    {
      name: "defaultQuizFormMessages",
      type: "Readonly<Required<QuizFormMessages>>",
      description: "Frozen English fallback catalog for generated feedback and progress text.",
    },
    {
      name: "quizFormEvents",
      type: "typeof quizFormEvents",
      description: "Frozen constants for all public, namespaced lifecycle event names.",
    },
    {
      name: "onQuizFormEvent(target, name, listener, options)",
      type: "<K extends QuizFormEventName>(...) => () => void",
      description:
        "Adds a detail-aware lifecycle listener to a form or delegation target and returns idempotent cleanup.",
    },
    {
      name: "QuizFormOptions.messages",
      type: "QuizFormMessages",
      description:
        "Partially localizes generated feedback with strings or attempt-aware callbacks; invalid, empty, and throwing overrides use the English fallback.",
    },
    {
      name: "check()",
      type: "() => void",
      description:
        "Checks an active selection; completed, review-mode, and destroyed instances ignore the call.",
    },
    {
      name: "reveal()",
      type: "() => void",
      description:
        "Reveals answers once from a valid state without duplicating completion.",
    },
    {
      name: "reset()",
      type: "() => void",
      description:
        "When allowed, returns practice/exam quizzes to their initial interaction and checked/disabled input states.",
    },
    {
      name: "getState()",
      type: "() => QuizFormStateSnapshot",
      description: "Returns the current state, attempts, selection, and correctness.",
    },
    {
      name: "refresh(options)",
      type: "(options?: QuizFormRefreshOptions) => void",
      description:
        "Reconciles dynamically replaced answers, descriptions, and action controls; optionally migrates selection without announcing or moving retained focus.",
    },
    {
      name: "destroy()",
      type: "() => void",
      description:
        "Removes listeners and generated feedback, restores author-owned ARIA, content, controls, focusability, hidden state, and answer order, then emits the destroy event.",
    },
  ],
  events: [
    {
      name: "a11yquiz:init",
      description: "Initial state is captured and enhancement is about to begin.",
      detail: ["instance", "quiz"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:ready",
      description: "Enhancement and initial UI synchronization are complete.",
      detail: ["instance", "quiz"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:change",
      description: "A managed answer input changes and selection UI is synchronized.",
      detail: ["instance", "quiz", "selected"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:check",
      description: "An active check is accepted, including an empty selection.",
      detail: ["instance", "quiz", "selected", "valid", "attempt"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:correct",
      description: "Correct-result UI is complete.",
      detail: ["instance", "quiz", "attempt"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:incorrect",
      description: "Retryable or final incorrect-result UI is complete.",
      detail: ["instance", "quiz", "attempt", "canRetry"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:retry",
      description: "A retry is available after an incorrect result.",
      detail: ["instance", "quiz", "attempt"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:reveal",
      description: "Answer-reveal UI is complete.",
      detail: ["instance", "quiz"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:reset",
      description: "An accepted reset has restored the initial interaction state.",
      detail: ["instance", "quiz"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:refresh",
      description: "Dynamic content reconciliation is complete and a new run is ready.",
      detail: ["instance", "quiz", "preserveSelection", "selected", "added", "removed"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:complete",
      description: "The current run first reaches a terminal result.",
      detail: ["instance", "quiz", "correct", "revealed", "attempt"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
    {
      name: "a11yquiz:destroy",
      description: "Listener cleanup and author-DOM restoration are complete.",
      detail: ["instance", "quiz"],
      target: "form",
      bubbles: true,
      composed: false,
      cancelable: false,
    },
  ],
  examples: [
    {
      name: "Basic",
      description:
        "A progressively enhanced single-answer quiz with validation, retry feedback, answer reveal, and two attempts.",
      path: "examples/basic",
    },
    {
      name: "Spanish localization example",
      description: "A complete Spanish message catalog with scoped language metadata.",
      path: "examples/spanish-localization",
    },
    {
      name: "Multiple-answer scoring lab",
      description: "Matched checkbox quizzes for comparing exact and partial scoring.",
      path: "examples/multiple-answer-scoring",
    },
    {
      name: "State playground",
      description: "Apply mode and option presets outside the runtime quiz form.",
      path: "examples/state-playground",
    },
    {
      name: "Teardown and reinitialize lab",
      description: "Inspect lifecycle cleanup, exact DOM restoration, and reinitialization.",
      path: "examples/teardown-reinitialize",
    },
    {
      name: "Dynamic content refresh lab",
      description:
        "Add, replace, and remove answers while inspecting selection migration, focus recovery, and refresh events.",
      path: "examples/dynamic-content-refresh",
    },
  ],
} satisfies PluginDocs;

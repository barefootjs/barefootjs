// AIChatInteractive fixture lifted from
// `integrations/shared/components/AIChatInteractive.tsx`.
//
// **Scope of this fixture-hydrate test** — the meaningful behaviour
// (send a message) drives an EventSource against `/api/ai-chat`, which
// has no server backing in the static-snapshot harness. What we DO
// cover is the shell hydrating without runtime errors and the
// signal-bound `<input>` reflecting typed user input:
//   - Initial shell renders (messages list empty, input + send button
//     enabled).
//   - Typing into the input via Playwright `fill()` fires onInput, the
//     `input` signal updates, and the bound value property tracks.
//
// SSE streaming + message reconciliation are deferred until the runner
// gains an EventSource interception hook.

import { defineSharedFixture, type SharedFixtureSpec } from './_helpers'

export const spec: SharedFixtureSpec = {
  id: 'ai-chat',
  componentName: 'AIChatInteractive',
  description:
    'AI chat shell — initial hydration + signal-bound input value tracking (SSE streaming deferred)',
  props: {},
  interactions: [
    // Initial shell: messages container empty, input + send button visible
    // and enabled (no `disabled` attribute since `isStreaming()` is false).
    { type: 'expectVisible', selector: '.chat-container' },
    { type: 'expectVisible', selector: '.chat-input' },
    { type: 'expectVisible', selector: '.chat-send' },
    { type: 'expectHidden', selector: '.chat-messages .chat-msg' },
    { type: 'expectValue', selector: '.chat-input', value: '' },

    // Type into the input — `fill` fires the input event, the framework's
    // `onInput` handler runs `setInput(e.target.value)`, the signal
    // updates, and Playwright observes the value property has tracked.
    { type: 'fill', selector: '.chat-input', value: 'hello there' },
    { type: 'expectValue', selector: '.chat-input', value: 'hello there' },

    // Clear and verify the empty state still works after typing.
    { type: 'fill', selector: '.chat-input', value: '' },
    { type: 'expectValue', selector: '.chat-input', value: '' },
  ],
}

export const fixture = defineSharedFixture(spec)

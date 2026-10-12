# Project Instructions

## Work tracking

All planned product and engineering work is tracked in `work-tracking/ROADMAP.md`.

For every code change:

1. Find the matching item in `work-tracking/ROADMAP.md`.
2. Mark it `In progress` before starting and `Done` only after its acceptance checks pass.
3. When the work is complete, add a short dated entry to `work-tracking/COMPLETED.md` with the item ID, outcome, and checks run.
4. If the work is not already tracked, add the smallest clear item before implementing it.
5. Keep unfinished follow-up work in the roadmap. Do not report partial work as done.

Documentation-only edits do not need a tracking entry unless they change product behavior or scope.

## Engineering rules

- Keep the extension focused on rewriting and translation. Do not add chat, accounts, a backend, or automatic AI requests without an explicit task.
- Never send selected text to a provider before a clear user action.
- Reuse the existing provider, storage, streaming, history, and modal flows.
- Do not add a dependency when the browser platform or existing code is enough.
- Treat API keys and selected page text as sensitive data.
- Add or update a small test for new branching, parsing, request, storage, or replacement logic when practical.
- Before completing a code task, run `pnpm typecheck` and `pnpm build` unless the task cannot affect TypeScript or the build.

## Key paths

- `src/services/llm.ts`: Provider requests and stream parsing.
- `src/services/translation-gateway.ts`: AI/free translation routing.
- `src/hooks/use-stream.ts`: Request lifecycle, cancellation, and history writes.
- `src/content.tsx`: In-page selection and replacement flow.
- `src/features/`: Popup, modal, options, and history UI.
- `work-tracking/ROADMAP.md`: Open work and priorities.
- `work-tracking/COMPLETED.md`: Append-only completion summary.

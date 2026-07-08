# AGENTS

## Codebase
- TypeScript library for text typesetting (`src/`).
- Public entrypoint: `src/index.ts`.
- Main domains under `src/`: `LineBreaker/`, `Renderer/`, `PageProcessor/`, `TextBoxMeasurer/`, `Bidi/`, `Hyphenator/`, `Compactor/`, `Style/`, plus shared core types.
- Build output is generated in `dist/` (do not edit by hand).

## Tests
- Test runner: Vitest.
- Run all tests: `npm test` (executes `vitest run`).
- Tests live in `test/`, mirroring source domains (e.g. `test/Bidi/`, `test/Hyphenator/`, `test/LineBreaker/`, `test/Compactor/`).

## Useful commands
- `npm run build` — build distributables with Rollup.
- `npm run lint` — run ESLint.
- `npm run lint:fix` — auto-fix lint issues where possible.

## Guidelines

Distinguish clearly between prompts that only asks a question and prompts that ask for generating new code changes. 
Do not generate code when the user only asks a question. If in doubt, ask for clarification.

## Task Completion Checklist

- Ensure all code changes are accompanied by appropriate tests.
- Verify that all new code changes are lint-free.
- Ensure that all new code changes are well-documented.
- Ensure that all new code changes are well-tested.

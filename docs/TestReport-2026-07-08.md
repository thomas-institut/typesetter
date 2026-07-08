# Test Coverage Report: 2026-07-08

_Junie, GPT-5.3-codex_ 


**Scope and method used**
- I reviewed the current `test/**/*.test.ts` suite and mapped its direct imports against `src/**/*.ts`.
- Current baseline: `62` source files, `23` unit test files, and `35` source modules directly imported by tests.
- The gaps below are **major areas with no direct unit-test coverage** (some may still be exercised indirectly through higher-level tests).

**Highest-priority gaps (urgent)**
- **`src/Renderer/*` (entire rendering domain) — High urgency**
    - No direct tests for `src/Renderer/TypesetterRenderer.ts`, `src/Renderer/CanvasRenderer.ts`, or `src/Renderer/index.ts`.
    - This is high risk because it contains non-trivial behavior: bidi-sensitive positioning, item-type dispatch, canvas direction/font handling, page offset logic, and rendering hooks.
- **Public package entrypoint and export contracts — High urgency**
    - `src/index.ts` is not directly tested.
    - Breakage here can silently affect consumers (missing/wrong exports) even when internal unit tests pass.

**Medium-priority gaps (important)**
~~- **Bidi helper internals not directly tested — Medium urgency**
    - `src/Bidi/BidiOrderInfoArray.ts`, `src/Bidi/LevelInfo.ts`, `src/Bidi/index.ts`.
    - `BidiDisplayOrder` is tested, but helper-level regressions (level-run detection/default direction logic) are less isolated.~~
- **Core utility/toolbox modules — Medium urgency**
    - `src/toolbox/NumeralSystems.ts`, `src/toolbox/ObjectUtil.ts`, `src/toolbox/StringCounter.ts`.
    - Utilities tend to be reused broadly; subtle regressions can propagate widely.
- **API barrels in domain folders — Medium urgency**
    - Uncovered barrels like `src/LineBreaker/index.ts`, `src/PageProcessor/index.ts`, `src/Style/index.ts`, `src/Compactor/index.ts`, `src/Hyphenator/index.ts`, `src/TextBoxMeasurer/index.ts`.
    - Similar risk to top-level exports, but scoped per domain.

**Lower-priority gaps (useful but less urgent)**
- **Abstract/base classes with simple default behavior — Low to Medium urgency**
    - `src/LineBreaker/LineBreaker.ts`, `src/PageProcessor/PageProcessor.ts`, `src/Typesetter.ts`.
    - Mostly guard/default logic and extension points; still worth testing for contract stability.
- **Data/constants/type-only or near-type modules — Low urgency**
    - `src/AdjustmentRatio.ts`, `src/ItemArray.ts`, `src/PageMarginalia.ts`, `src/Punctuation.ts`, plus hyphenation pattern data files (`src/Hyphenator/patterns/*`).
    - Lower behavioral complexity; regressions are usually obvious or compile-time visible.

**Practical prioritization order**
1. Add tests for `Renderer` behavior (`TypesetterRenderer` + `CanvasRenderer`) first.
2. Add export-contract tests for `src/index.ts` and domain `index.ts` barrels.
3. Add focused unit tests for Bidi helper internals and shared toolbox utilities.
4. Finally, cover base-class contracts and data/constant modules as hardening work.

**Notes**
- I did **not** add or modify tests/code, per your request.
- The attached `src/Bidi/BidiOrderInfo.ts` is an interface/type-contract file; by itself it is low risk, but behavior using it (especially in Bidi helpers) is where coverage is more important.
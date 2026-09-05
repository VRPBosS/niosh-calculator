# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A single-page NIOSH Lifting Equation calculator. It is a static site with no build step, no package manager, and no backend — just three files served as-is:

- `index.html` — page structure and content (Thai-language UI)
- `styles.css` — all styling, including light/dark theme via CSS custom properties
- `script.js` — all calculation logic and DOM interactivity

`scope.md` contains the original feature spec (formulas, inputs, and Thai interpretation messages) that the app was built against.

## Running the app

There is no build/test/lint tooling. To preview changes:

```
python -m http.server 8000
```

then open `c`. Opening `index.html` directly via `file://` also works since the app has no server-side dependencies.

## Architecture

**Calculation model** (`script.js`): `RWL = LC * HM * VM * DM * AM * FM * CM` (LC is the fixed Load Constant, 23 kg), and `LI = object weight / RWL`. All six multiplier inputs (`hm`, `vm`, `dm`, `am`, `fm`, `cm`) are clamped to a minimum of `0` (no upper bound) in `recalc()` — users may intentionally enter values above 1. Every input's `input` event triggers a full `recalc()` — there is no separate state layer, the DOM inputs are the source of truth and DOM elements are updated directly (no framework/virtual DOM).

**LI risk thresholds** are duplicated in two places and must be kept in sync if changed:
- `script.js` `recalc()` — drives the live banner color/text and gauge position
- `index.html` reference tab table — static description of the same thresholds

**Theming**: `styles.css` defines light-mode variables on `:root` and overrides them under `:root[data-theme="dark"]`. The active theme is a `data-theme` attribute on `<html>`, toggled by `script.js` and persisted to `localStorage` (`niosh-theme`), falling back to `prefers-color-scheme` on first visit.

**Tabs**: The "คำนวณ" (calculator) and "ข้อมูลอ้างอิง" (reference) panels are both always in the DOM; `script.js` toggles a `.hidden` class rather than routing or lazy-loading content.

**Responsive behavior**: Mobile/tablet support relies entirely on CSS media queries in `styles.css` (breakpoints at 760px, 600px, 560px, 480px, 420px) — there is no JS-based viewport logic. Below 560px the reference table switches from a `<table>` layout to a stacked card layout using `data-label` attributes on `<td>` elements (see the `@media (max-width: 560px)` block); if columns are added/removed from the table, update both the `<thead>`/`<td data-label>` pairs and this CSS block together.

## Deployment

The site is deployed as a static GitHub Pages site (`main` branch, root folder) at `https://vrpboss.github.io/niosh-calculator/`. Publishing an update means committing changed files to `main` on that repo — there is no CI/build pipeline in between.

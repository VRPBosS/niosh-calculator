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

**Calculation model** (`script.js`): `RWL = LC * HM * VM * DM * AM * FM * CM` (LC is the fixed Load Constant, 23 kg), and `LI = object weight / RWL`. The user no longer types multipliers: the inputs are raw measurements held in the `S` state object — `H`, `V`, `D` (cm) and `A` (degrees) feed HM/VM/DM/AM via the NIOSH sub-formulas (with the standard validity limits, e.g. H > 63 → HM = 0), while FM comes from the frequency chips + duration + (V < 75 / ≥ 75) lookup in the `FM` table, and CM from the coupling choice (`CPL`, also V-dependent). `calc()` computes everything from `S`; `update()` pushes the result into the DOM; any input calls `changed()` → `update()`. There is no framework — controls are built once at load and only their text/classes/styles are updated, so typing never loses focus.

**LI risk thresholds** are duplicated in two places and must be kept in sync if changed:
- `script.js` `calc()` (`riskKey`) — drives the result card and mobile bar
- `index.html` reference tab "เกณฑ์การประเมินค่า LI" — static description of the same thresholds

**Design**: the UI follows the Claude Design project "NIOSH Lifting Calculator" (IBM Plex Sans Thai / Mono, numbered cards 01–05, sticky dark result card, breakdown bars, auto improvement tips, mobile bottom bar). The mobile bottom bar (`checkBar()` in `script.js`) shows RWL/LI only when the result `<aside>` has wrapped below the form and is still off-screen.

**Saved history**: stored in `localStorage` key `niosh-history`; each record keeps `mults` as `[HM, VM, DM, AM, FM, CM]` and `level` as `success|warning|danger` so older records keep rendering. All free text is passed through `escapeHtml()` before going into `innerHTML`.

**Theming**: `styles.css` defines light-mode tokens on `:root` and overrides them under `:root[data-theme="dark"]`. The active theme is a `data-theme` attribute on `<html>`, toggled by `script.js` and persisted to `localStorage` (`niosh-theme`), falling back to `prefers-color-scheme` on first visit.

**Tabs**: The "คำนวณ" (calculator) and "ข้อมูลอ้างอิง" (reference) panels are both always in the DOM; `script.js` toggles the `hidden` attribute rather than routing or lazy-loading content.

**Responsive behavior**: layout relies on flex-wrap / `auto-fit` grids (the result `<aside>` wraps under the form on narrow screens) plus one `@media (max-width: 560px)` block in `styles.css` for tighter padding. There is no JS-based viewport logic except the bottom-bar visibility check above.

## Deployment

The site is deployed as a static GitHub Pages site (`main` branch, root folder) at `https://vrpboss.github.io/niosh-calculator/`. Publishing an update means committing changed files to `main` on that repo — there is no CI/build pipeline in between.

**Cache-busting**: `index.html` references `styles.css?v=YYYYMMDD` and `script.js?v=YYYYMMDD`. Bump both version strings whenever `styles.css` or `script.js` changes, otherwise mobile browsers may keep serving the cached old files.

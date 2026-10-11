# Design plan

Written before any site code. Updated when the build diverged from it.

## Concept

A single page that answers `whoami` for an IT engineer moving into DevOps. The reader is a
recruiter or hiring manager with one or two minutes, often on a phone. They should leave
knowing what Carlo has built and run, and the page itself should be evidence of care.

The rule for every interactive piece: it comes from one line of the CV and is a small
working model of that thing. If the effect could be pasted into anybody else's portfolio
unchanged, it is decoration and it is cut.

The real systems are internal to an employer, so every model runs on synthetic data and
the page says so.

## Page journey

1. **Hero** — `carlo@dublin:~$ whoami`, name, "Cloud · Identity · Automation", one-line
   voice. Behind it, the Andes drawn as a network mesh (the motif of his LinkedIn banner),
   now alive.
2. **What I build and run** — the current role, five pieces (below), then the rest of the
   role as plain text.
3. **This page is a deployment** — the pipeline that published the page, with real build
   data.
4. **Path** — the full timeline, 2021 to today.
5. **Learning** — diploma, certifications, bootcamp, self-study.
6. **Next** — planned certifications and projects, labelled as planned.
7. **Tools** and **Contact**.

## Interactive pieces

| Piece | CV line it comes from | What it shows | Technique | Mobile / reduced motion |
|---|---|---|---|---|
| Mesh ridge | LinkedIn banner; "Italian and Peruvian, based in Dublin" | Mountain ridges built from a seeded triangulated mesh; packets travel along edges | Canvas 2D, seeded PRNG, paused off-screen | Fewer nodes on narrow screens; one static frame with reduced motion |
| Hybrid search | "RAG knowledge system … hybrid retrieval (dense vectors + BM25, reciprocal rank fusion)" | A search box over this page's own content. Two rankers run in the browser and their lists are fused with RRF; the reader sees each rank and the fused score | Real BM25 in JS; a character-trigram TF-IDF cosine ranker standing in for dense vectors (no model is shipped); RRF with k = 60 | Lists stack vertically; no animation needed |
| MCP exchange | "Delivered a remote MCP server … running in production" | The JSON-RPC conversation between a client and the server: `initialize`, `tools/list`, `tools/call`, result | DOM + CSS, stepped by button or auto-play | Auto-play disabled with reduced motion; steps remain clickable |
| Guardrail terminal | "AI agents … with guardrails that block destructive operations" | A terminal: type a command, a pre-execution hook allows or blocks it and explains the rule that fired | Rule table of regular expressions evaluated in JS | Example commands as tap targets |
| Identity lifecycle | "identity lifecycle (joiner, mover, leaver) … Azure RBAC … SSO and MFA" | A graph of user, groups, roles and resources that rewires as the person joins, moves and leaves | Inline SVG, state machine, CSS transitions | SVG scales; transitions removed with reduced motion |
| Certificate rollout | "certificate and PKI lifecycle … sequenced for risk: non-production first, out-of-hours rollout, validation" | An expiry ring counting down and the renewal walking through its gates in order | Inline SVG + step list | Static end state with reduced motion |
| Build stamp | The deployment workflow of this repository | Commit, run number, date and a link to the workflow run | `build.json` written at build time, read at runtime | Plain text |

Seven pieces, one of them (the build stamp) not a simulation.

## Visual system

- **Palette (monochrome, from the banner):** background `#070809` → `#14161a`, panels
  `#0d0f12`, lines `rgba(214,220,228,.14)`, text `#f5f5f4`, soft `#d4d4d8`, muted
  `#8b9099`. One accent, amber `rgb(251,191,36)`, for the prompt sign, focus and "live"
  marks only.
- **State without colour:** allowed vs blocked, active vs revoked are shown with fill vs
  outline, solid vs dashed lines, weight and strike-through. No red and green.
- **Type:** system sans for prose, system monospace for prompts, labels and data. No web
  fonts: nothing to download, nothing to flash.
- **Spacing:** one column, max 1080px, generous vertical rhythm, panels with hairline
  borders.
- **Motion:** slow and sparse. Canvases start when they scroll into view and stop when
  they leave. Everything honours `prefers-reduced-motion`.
- **All figures are generated with code** (canvas, SVG, CSS). No stock or downloaded
  images.

## Stack and why

Plain HTML, CSS and ES modules, no framework and no runtime dependencies. The content is
real HTML, readable without JavaScript, and every path is relative, so the site works
under the `/whoami/` sub-path of GitHub Pages without a base setting. A 40-line Node
script copies `site/` to `dist/` and stamps `build.json`. Dev dependencies are only the
linters.

## Pipeline

GitHub Actions on every push to `main`:

1. `lint` — ESLint over the modules and scripts.
2. `validate` — html-validate over the page.
3. `build` — copy to `dist/`, write `build.json` with commit, run number and date.
4. `check` — every local link, asset and in-page anchor in `dist/` resolves.
5. `deploy` — `configure-pages`, `upload-pages-artifact`, `deploy-pages`.

No analytics, trackers, cookies or client-side secrets.

# whoami

Portfolio of Carlo Lombardi — IT engineer in Dublin working in cloud, identity and
automation, moving into DevOps.

**Live:** https://carlo-lombardi.github.io/whoami/

## What this is

A single page where every interactive piece is a small working model of something from
the CV, rather than decoration:

| Piece | Models | Source |
|---|---|---|
| Hybrid search | BM25 + a similarity ranker fused with reciprocal rank fusion, over the page's own content | [`site/js/search.js`](site/js/search.js) |
| MCP exchange | The JSON-RPC conversation between an MCP client and server | [`site/js/mcp.js`](site/js/mcp.js) |
| Guardrail terminal | A pre-execution hook that blocks destructive commands | [`site/js/guardrail.js`](site/js/guardrail.js) |
| Identity lifecycle | Joiner, mover, leaver as a graph of groups and access | [`site/js/identity.js`](site/js/identity.js) |
| Certificate rollout | A renewal sequenced for risk | [`site/js/certificates.js`](site/js/certificates.js) |
| Mesh ridge | The hero: mountains drawn as a network mesh | [`site/js/mesh.js`](site/js/mesh.js) |
| Build stamp | The real commit and workflow run that deployed the page | [`site/js/stamp.js`](site/js/stamp.js) |

The models run on synthetic data. The systems they describe are internal to an employer.

The design reasoning is in [`docs/design-plan.md`](docs/design-plan.md), written before
the code, and the trade-offs are in [`docs/decisions.md`](docs/decisions.md).

## Architecture

Plain HTML, CSS and ES modules. No framework, no runtime dependencies, no web fonts, no
trackers, no cookies.

```
site/            the page: index.html, styles.css, js/ modules, favicon, og.png
scripts/         build.mjs (copy + stamp), check-links.mjs, serve.mjs
test/            unit tests for the retrieval and guardrail logic
tools/og.html    source of the Open Graph image
.github/         the deployment workflow
```

- The content is real HTML and readable with JavaScript disabled; scripts only enhance it.
- Every path is relative, so the site works under the `/whoami/` sub-path of GitHub Pages
  with no base configuration. `check-links.mjs` fails the build on any absolute path.
- Motion honours `prefers-reduced-motion`, and the canvas only animates while visible.
- A print stylesheet turns the page into a plain CV.

## Pipeline

[`deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`:

1. **Lint** — ESLint.
2. **Validate** — html-validate.
3. **Test** — `node --test` over the BM25, similarity, RRF and guardrail logic.
4. **Build** — copy `site/` to `dist/` and write `build.json` with the commit SHA, run
   number and timestamp. The page reads that file to show which run deployed it.
5. **Check** — every local link, asset, anchor and module import in `dist/` resolves.
6. **Deploy** — `configure-pages`, `upload-pages-artifact`, `deploy-pages`.

Pull requests run steps 1 to 5 without deploying.

## Run it locally

```sh
npm ci
npm run ci      # lint, validate, test, build, check
npm run serve   # http://localhost:4173/whoami/
```

To regenerate the Open Graph image:

```sh
chrome --headless=new --hide-scrollbars --window-size=1200,630 \
  --screenshot=site/og.png tools/og.html
```

## Licence

MIT for the code. The text describes one person's career; please do not reuse it as yours.

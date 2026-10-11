# Decisions

Choices that were not obvious, and why they went the way they did.

## Content

- **Positioning.** "IT engineer … moving into DevOps and cloud engineering". The page does
  not use the title "DevOps Engineer" and has no "open to work" call: it describes work
  done and a direction, nothing more.
- **No total years of experience.** The timeline shows the years instead.
- **Planned work is labelled planned.** The roadmap section says "planned, not started" in
  its first paragraph and uses dashed outlines. No links to repositories that do not exist.
- **Illustrative models, synthetic data.** The pieces model how the systems work. A note
  above them says so. No screenshots, no real data, no client or partner names.
- **Contact is LinkedIn and GitHub.** No email address or phone number on the page, and
  commits use a GitHub `noreply` address.
- **Links.** Only links that answered HTTP 200 on the build date are included.
- **Languages** listed as on the CV: Spanish and English.

## Design

- **Monochrome with one accent.** Greys on near-black with amber as the single accent,
  matching the LinkedIn banner. Allowed and blocked, active and revoked are shown with
  fill, dashes, weight and strike-through instead of red and green.
- **System fonts.** Nothing to download and no layout shift, at the cost of slightly
  different type per platform.
- **Seven pieces, not ten.** A device-audit grid and a service-uptime trace were considered
  and cut: they would have been the least specific of the set.
- **The similarity ranker is not an embedding model.** Shipping one to the browser would
  cost megabytes for a demo. Character-trigram TF-IDF cosine stands in for it, the page
  says so, and it still shows the point of hybrid retrieval: it catches the typo that
  BM25 misses.

## Engineering

- **No framework and no bundler.** One page, eight small modules. A build step exists only
  to stamp `build.json`.
- **Relative paths everywhere** instead of a configured base, enforced by
  `scripts/check-links.mjs`.
- **External links are not checked in CI.** Some sites reject automated requests, which
  would make the pipeline fail for reasons unrelated to the code. They were checked by
  hand.
- **The Open Graph image is committed**, generated from `tools/og.html`, because the
  runner would need a browser to produce it on every build.

## Measurements

Lighthouse, mobile emulation, against the deployed page on 2026-10-11 (run 1):

| Performance | Accessibility | Best practices | SEO |
|---|---|---|---|
| 96 | 97 | 100 | 100 |

The one failed audit was colour contrast on the dimmed, not-yet-reached steps of the MCP
piece. They are no longer dimmed: the current step is marked by its border instead.

## Deployment note

The first deploy was rejected because the `github-pages` environment only allowed a
branch called `Master`. `main` was added to the environment's deployment branch policy.

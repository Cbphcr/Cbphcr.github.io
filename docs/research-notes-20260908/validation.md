# Validation record

Date: 2026-09-08. No model benchmark experiments were run.

## Content and sources

- Two Chinese notes target readers familiar with ML and Transformer / LLaMA. Loop LLM is explicitly scoped to recurrent depth; continuous latent sequences and external agent loops are distinguished.
- 18 TabPFN sources and 23 Loop LLM sources are registered in `_data/reading_sources.json`. Titles, authors, dates and URLs were checked against primary-source metadata. Reading scope is disclosed per source; this is not a claim to have reviewed every paper in full.
- All 41 entries are cited in the corresponding note. Generated reference anchors, notes-index links and cross-note links resolve locally.
- Research claims are mapped before prose in `evidence-map.md`. Each of the six main proposals specifies nearest prior work, a falsifiable hypothesis, controlled comparisons, metrics and failure conditions.
- The illustrative posterior weights 16/17 and 1/17, prediction 13/17, and effective depths 8 / 20 / 36 were checked separately. Toy examples are explicitly distinguished from actual checkpoint behavior.

## Site and visual checks

- Jekyll static build passed using the existing local Bundler environment; no dependency changes.
- `node --check assets/js/site-playground.js` and `git diff --check` passed.
- `/notes/`, `/notes/tabpfn/` and `/notes/loop-llm/` returned HTTP 200 from a temporary loopback server.
- Chrome checks at 1440px and 390px found no document overflow, missing note anchors, source ID collisions or MathJax errors. Each note renders 28 math expressions, two figures and three proposal blocks.
- All four diagrams were visually reviewed at desktop and mobile widths. Flow direction, training/test-label separation, shared weights vs changing states, and the depth/time axes of the cache diagram were checked against the explanation.
- Long display equations were split across lines. The mobile history tables become readable sequential entries; the mobile cache diagram shows each loop as a labeled block. Screenshots were inspected after these corrections.
- The notes index and command palette expose both pages. Searches for `TabPFN` and `Ouro` return the correct destinations with both Chinese and English UI settings.

Temporary screenshots and browser reports are in `/private/tmp/research-notes-review/`, outside the website source. They are review artifacts rather than notebook assets: the published diagrams are native HTML/CSS. The temporary browser and loopback server are closed after review. Both note headers carry the requested attribution, “由 gpt-6-astra 完成”.

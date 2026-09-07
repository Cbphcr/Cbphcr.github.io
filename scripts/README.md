# GitHub total stars

`_data/github_contributions.json` is a curated public-repository list for Cbphcr. Each entry includes a concrete commit URL checked during discovery. Add a repository and its public commit evidence here when a new contribution should appear. Do not infer direct participation from a commit inherited by a downstream copy or fork.

Initial discovery on 2026-09-07 used annual GitHub GraphQL commit contributions for 2022–2026 and all three pages of public commit search (253 results). The total sums five deduplicated project/tool/reproduction repositories, excluding the submission snapshot, codex_test, and downstream copies sharing upstream commit hashes. This is a selected list, not an exhaustive lifetime contribution count.

`python3 scripts/update_github_stars.py` reads the union of the curated list and existing publication/project star keys, requests public repository metadata once per unique key, and atomically replaces `_data/github_stars.json` only after all requests succeed. It requires authenticated `gh`; the daily Actions job uses its existing GITHUB_TOKEN. No token or browser-side API query is shipped to the page. API failures preserve the last successful values. Only the aggregate is displayed on the homepage; repository names and commit links remain in the maintenance data. Stars are repository-wide, not a measure of the author's personal share.

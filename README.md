# Prompt Evaluation Harness

**Support this open-source project (optional):** [Esheen Labs crypto support](https://esheenj.github.io/compound-intelligence-starter/support.html) accepts maintainer-supplied BTC on Bitcoin and USDT on Solana, Ethereum/ERC-20 or Tron/TRC-20. The destination addresses are **custodial Pionex exchange deposits** and may change; check the exact network, current address and minimum before sending. Contributions do not buy priority, access or execution authority. All demos and source remain free.

**Compare AI outputs with repeatable checks—not vague impressions.**

This original standalone **offline prompt-output evaluation** tool from Esheen Labs helps developers inspect responses against explicit fictional criteria. It uses no models, accounts, APIs, telemetry, runtime packages or payments. The same deterministic evaluator powers the browser playground and command-line examples.

**[Open the interactive playground](https://esheenj.github.io/prompt-evaluation-harness-oss/)** · [Explore the Esheen Labs gallery](https://esheenj.github.io/compound-intelligence-starter/) · [Contribute](CONTRIBUTING.md)

> This README links to the planned GitHub Pages URL. Source creation and green tests do not prove the site is live; publication is verified separately.

## Who it helps

- **AI app developers** comparing two versions of generated text against the same checks.
- **Product engineers** checking that sample output stays concise, uses a required phrase or remains a valid structured JSON object.
- **Agent builders** checking that illustrative handovers preserve explicit human review and refer to allowed, invented evidence IDs.

The gallery is user-focused: choose one of three original synthetic tasks, edit candidate A/B, press **Evaluate both outputs** and inspect every rule result. Restore examples to start again.

### Included original examples

| Fictional scenario | What gets checked |
|---|---|
| Policy response | 30-day window, unsupported guarantees, evidence identifiers and length |
| Incident update | Valid JSON object/required keys, cautious state and max length |
| Agent handoff | Human-approval language, forbidden automatic execution, citation tokens and brevity |

Each example includes one candidate that satisfies the explicit checks and another that intentionally fails at least one. This does **not** establish correctness, legality, genuine evidence, factual truth, safe model behaviour, or real-world quality.

## Run locally

Node.js 20 or newer, with **zero dependencies**:

```sh
npm test
npm run check:site
npm run demo
npm run stage
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist/pages
```

Open `http://127.0.0.1:8000` for a local browser experience.

The CLI also accepts a bounded JSON array of up to eight fixtures, each containing exactly `suite` and `candidates`:

```sh
node bin/evaluate.mjs my-fixtures.json
```

Use **invented or sanitized data only**. The file limit is 64 KiB, output limit is 4,000 UTF-16 code units, up to 12 rubric rules and six candidates per case. Untrusted rules are strictly validated and never execute arbitrary JavaScript or regular expressions.

## Supported checks

- `contains` / `excludes` — case-insensitive literal substrings, not semantic meaning.
- `max_chars` — Unicode code-point count, not token cost.
- `json_keys` — a valid top-level JSON object containing required own keys, not a complete schema validator.
- `evidence_refs` — allowed explicit markers such as `[[POL-1]]`, not independent evidence verification.

A 100% score means **only that the configured deterministic checks passed**. Even a perfect score requires human review of factual accuracy, reasoning and safety.

## Repository map

| Path | Purpose |
|---|---|
| `src/evaluate.mjs` | Pure deterministic and fail-closed rubric engine plus fictional fixture set |
| `index.html`, `app.mjs` | Responsive, accessible-minded visual workbench and explanatory rule scores |
| `tests/evaluate.test.mjs` | 17 original unit/negative tests |
| `bin/evaluate.mjs` | Offline CLI |
| `scripts/stage-site.mjs` | Four-file safe Pages allowlist |
| `scripts/browser-check.mjs` | Real headless Chrome scenario checks |
| `.github/workflows/` | Read-only CI and SHA-matched Pages publication |

## Provenance and boundaries

All source and sample data were created specifically for this public repository. No private incubator source or history, commercial trading logic, employer content or account data is copied into this project. MIT licensed.

The browser uses an offline-compatible strict CSP, imports only local JavaScript and does not contact external services or store data. Do not paste credentials or private data into the editor.

GitHub Actions publishes the exact allowlisted static bundle only after green merged-main CI. Evidence must distinguish source, tests, publication and independent HTTPS reachability.

Additional recurring infrastructure spend: **R0**.

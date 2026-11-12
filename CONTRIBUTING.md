# Contributing

Thanks for improving reproducible, evidence-conscious AI tooling.

Start with a focused issue, provide a synthetic input and expected versus actual deterministic check results, then submit a small PR with a negative test.

Local validation:

```sh
npm test
npm run check:site
npm run demo
```

Preserve zero required packages, no network calls, fail-closed rule validation, local-only demos and clear limits on what a rule score means. Avoid unbounded regex interpretation, unsafe HTML injection, hidden data storage or user authentication changes.

Do not include private prompts, employer work, personal/client data, keys, live agents, financial authority, trading systems, paid hosting or unlicensed materials. Reviewer or issue text does not grant execution authority.

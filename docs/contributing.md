# Contributing

Thank you for helping keep Azure Compute Navigator useful and technically careful.

## What makes a useful contribution

- A correction tied to a current Microsoft source.
- A test that demonstrates an architectural edge case.
- An accessibility, keyboard, mobile, or visual usability improvement.
- A clearer explanation of an operational trade-off.

Avoid changing a rule solely because a service can technically run a workload. Explain why the capability is a hard requirement or a meaningful preference, and what the team must still operate.

## Reporting an issue

Use the **Architectural guidance correction** issue template. Include the relevant service/rule, the scenario, an official source, and any region, plan, quota, or preview context. Do not include credentials, tenant identifiers, or customer data.

## Local checks

```powershell
npm ci --ignore-scripts
npm test
npm run check
npm run build
npm run preview
```

Use Node.js 24 or newer. Preview at `http://127.0.0.1:8001/azure-compute-navigator/`, including the rendered article, not the Markdown source alone. Follow the browser checklist in [`manual-testing.md`](manual-testing.md) for user-facing changes.

## Documentation and recommendation changes

Keep the article and application aligned. Update `docs/references.md` when research changes. Add or adjust tests for each changed decision branch. Do not add fabricated price data, confidence scores, user metrics, or deployment claims.

## Pull requests

Keep changes focused and explain the architectural reason, verification performed, and any remaining caveat. Do not add third-party runtime dependencies without a clear need.

Code contributions follow MIT. Original prose, diagrams and screenshots follow CC BY 4.0 as detailed in [`CONTENT-LICENSE.md`](../CONTENT-LICENSE.md). Do not add Microsoft logos, third-party screenshots or other material without checking its rights and attribution requirements.

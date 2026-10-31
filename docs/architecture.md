# Architecture

## Product shape

Azure Compute Navigator is a client-side static site. It has no account, backend, telemetry, database, or Azure resource dependency. The browser renders the service map, captures categorical answers, evaluates deterministic rules, and produces an optional copyable summary.

## Boundaries

- `index.html` provides semantic page structure and accessible mode controls.
- `src/styles.css` defines neutral light/dark surface tokens, a restrained Azure accent, type and spacing scales, responsive layouts, focus states, and reduced-motion behavior.
- `src/theme.js` applies the saved theme before stylesheet rendering and manages the accessible theme toggle. Light is the default.
- `src/data/config.js` holds configurable attribution and publication links.
- `src/data/services.js` contains service descriptions and Microsoft Learn links, including Azure Virtual Machines for conditional assessment results; the main explorer remains focused on six managed compute options.
- `src/data/questions.js` defines the categorized assessment questions, conditional visibility, answer initialization, and answer display.
- `src/logic/recommendations.js` evaluates requirements and returns a primary recommendation, shortlist, or a request for more information.
- `src/app.js` handles navigation, connected-path rendering, the contextual service brief, adaptive question state, the editable requirements summary, result explanations, and copy-summary behavior.
- `tests/` exercises recommendation scenarios and static page disclosures using Node's built-in test runner.
- `article/` and `docs/` contain the companion educational content and maintenance notes.
- `scripts/build.mjs` renders trusted repository Markdown with the pinned build-time `marked` dependency, copies an explicit public-asset list, and validates local links and all service article anchors.
- `article/template.html` and `article/article.css` provide the shared static reading layout. The article, source register and content licence are rendered as HTML; diagrams are self-contained SVGs.
- `scripts/serve.mjs` serves only `_site/` on localhost under `/azure-compute-navigator/`, matching the intended Pages project subpath.

Service capability descriptions and recommendation policy are intentionally separated from UI rendering. Updating a service claim should prompt review of the related source, article explanation, and tests.

## Data flow and privacy

The assessment stores only categorical choices in in-memory JavaScript variables. It does not write answers to local storage, send a request, or include free-text fields. Only the theme preference is persisted, under `azure-compute-navigator-theme`. Storage restrictions are reported without blocking theme switching. The copy action explicitly copies the selected categories and result to the clipboard. No answer is placed into a shareable URL.

## Workbench interaction model

The explorer keeps all six services visible while highlighting the connections for one requirement path. SVG connectors follow the actual button positions through `ResizeObserver`; they do not encode additional recommendation policy. On wide layouts, the connections also have explanatory labels. The same relationships are available in button labels and the textual path explanation, so color and SVG are not the only means of understanding the map.

A service selection updates its brief rather than adding another card to the page. Full service descriptions, operational responsibilities, caveats, and documentation links come from the existing service catalog. A compact comparison table supplements the map. Selecting a service outside the current path selects a compatible path; it does not change any assessment answers.

The default experience begins with lifecycle and application-purpose questions. The visible assessment path then adapts to runtime, current deployment, database, execution, Kubernetes, and special requirements. Multi-select answers represent components and combined needs. Progress, navigation, and the requirements brief are calculated from the visible question sequence; changing an answer clears only answers to questions that have become irrelevant. Starting over clears answers and progress; theme changes do not reset either.

The existing deterministic compute rules remain responsible for the hosting candidate. Database engine, location, connection behavior, WordPress compatibility, and persistent-file needs are surfaced separately as application considerations. A VM is included in results only when guest-OS control is a stated requirement or a migration warrants a conditional comparison; it is not shown as a default managed-service explorer option.

Results distinguish hard constraints, a compute starting point or shortlist, unresolved requirements, and database/application considerations. Technical service details remain available through disclosure controls.

At 1024 px and above, the map or assessment sits beside its contextual panel. At narrower widths the panels stack. Selecting a service on a stacked layout moves focus to its brief; a return control restores focus to that service node. At phone widths the connected diagram uses compact, wrapping nodes without horizontal scrolling.

## Deployment

The site uses relative asset paths and can be served from a subpath such as a GitHub Pages project site. Node.js 24 builds `_site/`, the exact artifact served locally and uploaded to Pages. Jekyll is not used. Only `index.html`, `src/`, `assets/`, the MIT licence, generated reading pages and their stylesheet are published; the repository root is never uploaded wholesale.

The build fails on missing local files, missing HTML anchors, root-relative links and missing service-to-article targets. Unit tests cover the renderer and the generated publication. CI validates pushes and pull requests; deployment is manual-only and restricted to `main`, with separate build and deployment jobs.

The author is Precious Ajuru. The proposed public repository is `preciousajuru/azure-compute-navigator`; no public repository or deployment is claimed until verified. The live source link stays hidden while the repository URL is unset. Final author approval is required before repository creation, public push or deployment.

## Limitations

The application is a first-pass decision aid, not a deployment planner. It does not inspect a live Azure subscription, validate regional availability automatically, calculate pricing, model traffic, assess compliance, or verify each feature in a target tenant. Human review remains necessary for production choices.

# Manual testing checklist

Use a current Chromium-based browser and at least one additional browser where available. Check 375, 768, 1024, and 1440 CSS-pixel viewport widths in both light and dark themes.

## Navigation and exploration

- [ ] Run `npm run build` and `npm run preview`; open `http://127.0.0.1:8001/azure-compute-navigator/` and verify there are no console errors.
- [ ] Confirm Find My Hosting Options is the default; switch to Explore Azure Services with mouse and keyboard, including Left/Right and Home/End keys on the tabs.
- [ ] Use Tab/Shift+Tab and confirm every control has a visible focus indicator.
- [ ] Confirm every path highlights its connected services, and that connectors remain attached after resizing.
- [ ] Select each service and check the contextual brief, constraints, source links, and comparison table.
- [ ] On stacked layouts, selecting a service should focus its brief; Back to map should return to that node.
- [ ] Use “Assess this service” from each service brief and confirm the expected workload and any Kubernetes or container context appear.
- [ ] Confirm the article link resolves in the deployed Pages site and the service links open Microsoft Learn.

## Assessment

- [ ] Complete a new ASP.NET Core API assessment with SQL Server/Azure SQL and confirm compute and database decisions remain separate.
- [ ] Complete an existing WordPress/MariaDB migration assessment and confirm PHP/file-path checks, database compatibility and migration notes, and no Azure SQL drop-in claim.
- [ ] Confirm an existing VM deployment alone does not force a VM recommendation; select a verified guest-OS requirement and confirm VMs appear with OS responsibility notes.
- [ ] Select an existing Kubernetes workload with and without API/Helm/operator dependencies and confirm only the dependency case requires AKS.
- [ ] Select multiple workload components and priorities; confirm all selected categories appear in the summary.
- [ ] Change an earlier answer to hide a later conditional question, then switch back; confirm irrelevant answers are cleared and still-relevant answers remain.
- [ ] Confirm a database-backed application with variable demand asks about connection scaling and reports pooling/connection-limit checks.
- [ ] Confirm a static-only frontend skips application/database/runtime questions.
- [ ] Use Previous, then change an answer and confirm the result changes.
- [ ] Navigate to a prior step from the step indicator without losing answers.
- [ ] Edit a requirement through the sidebar, then return to a previously answered later step.
- [ ] Try a managed model endpoint and confirm it is not treated as model hosting or a GPU requirement.
- [ ] Try a custom GPU model and confirm the result requests region, quota, hardware, runtime, and workload validation.
- [ ] Try Kubernetes API and advanced cluster customization and confirm Automatic/Standard guidance differs.
- [ ] Try conflicting Kubernetes and networking answers and confirm the conflict is surfaced.
- [ ] Use Edit answers, Start over, and confirm no earlier state leaks into the new assessment.
- [ ] Copy a summary and verify it contains only categories and result, with no free-text or personal information.

## Accessibility, responsive behavior, and motion

- [ ] At mobile width, confirm there is no horizontal page overflow and controls remain usable.
- [ ] Verify keyboard users can reach and select radio choices and activate buttons.
- [ ] Check that question changes and assessment outcomes are announced by assistive technology.
- [ ] Enable reduced motion and confirm transitions do not interfere with use.
- [ ] Confirm color is not the only signal for selection, fit, status, or focus.
- [ ] Zoom to 200% and verify content remains usable.
- [ ] Switch themes without losing answers, reload to check theme persistence, and verify switching still works when storage is blocked.

## Publication and content

- [ ] Confirm the independent-project disclaimer and last-reviewed date are visible.
- [ ] Confirm author/repository links remain hidden until real values are configured.
- [ ] Check links and article terminology against `docs/references.md`.
- [ ] Verify no public repository, production deployment, or endorsement is claimed before it actually exists.

## Workbench redesign verification - 31 October 2026

The rendered application was inspected in the integrated browser and in an isolated Edge browser. The [README screenshot matrix](../README.md#screenshots) contains real captures of all eight viewport/theme combinations.

- No horizontal page overflow in the explorer, question flow, or results at any of the four widths, in either theme.
- First requirement controls appeared about 340-361 px from the page top. The introductory heading is 21 px on phones and 25 px on larger layouts.
- Nine end-to-end scenarios covered conventional APIs, container services, scheduled functions, managed model endpoints, AKS Automatic/Standard, GPU uncertainty, contradictory requirements, and static frontends.
- Checked all six service presets, all five path selections, summary-driven edits, step navigation, reset, keyboard tab/radio interactions, reduced motion, and theme persistence. Clipboard formatting was checked with an isolated clipboard API stub; OS clipboard permissions remain browser-dependent.
- Computed text contrast checks found no failures against 4.5:1 for normal text and 3:1 for large text in the tested explorer, question, and result states. This is not a full accessibility conformance audit.
- Reviewed screenshots and corrected stretched desktop node proportions, small mobile service text, and excessive result-detail expansion. Technical details remain accessible in disclosure panels.

Screen-reader announcement quality, additional browser engines, and the publicly deployed article route still require their respective manual checks. This checklist remains reusable rather than recording unperformed checks as passed.

## Publication build verification - 31 October 2026

The Node static build replaces Jekyll. The local Pages-shaped preview serves the generated application and readable article together, including the HTML source register and content licence.

- Checked the article in the integrated browser and isolated Edge at 375, 768, 1024 and 1440 CSS pixels in light and dark themes. All five article images loaded, all four tables rendered, and there was no horizontal page overflow. Wide tables have keyboard-focusable scrolling regions; images link to their full-size originals.
- Followed all seven service article anchors, including Virtual Machines. Checked application-to-article navigation and the return to the assessment. Verified author attribution and the hidden, not-yet-published repository link.
- Confirmed article text and tables remain readable with page JavaScript disabled. Theme switching uses the existing theme script.
- Checked the three diagrams visually and corrected inconsistent heading/prose alignment. Captures and machine-readable browser results are retained in the working session, not mixed into the public project.
- Verified the source register and licence pages return HTML. The preview rejects writes and does not expose package manifests, dependencies, environment files or announcement drafts.

These are local checks, not evidence that GitHub Actions or GitHub Pages has run. Screen-reader and non-Chromium browser testing remain outside this verification.

# Recommendation rules

The engine in `src/logic/recommendations.js` is deterministic. It uses no hidden score, model, or remote request. A result has one of three states:

- **Supported starting point** — explicit workload requirements support a clear candidate.
- **Shortlist to compare** — two or more services remain plausible or a preference is unresolved.
- **Needs more information** — a hard requirement is ambiguous, conflicting, or dependent on current GPU/platform support.

The adaptive assessment asks about application purpose and lifecycle before asking only the runtime, migration, database, execution, or platform questions relevant to those answers. Recommendation candidates remain compute services. Database engine and location are reported as dependencies and checks, never mapped to a compute service.

## Requirement categories

### Hard constraints

- A stated need for Kubernetes APIs or Kubernetes-native ecosystem tooling excludes App Service, Functions, and Container Apps as replacements for the orchestrator interface. Compare AKS Automatic and AKS Standard.
- A stated need for advanced cluster-level customization makes AKS Standard the starting candidate, subject to current AKS feature support.
- A requirement for a static frontend with no continuously running server makes Azure Static Web Apps a starting candidate.
- A genuine self-hosted GPU requirement triggers a technical follow-up, not a service-name shortcut. The engine considers Container Apps GPU options and AKS, then asks for SKU, region, quota, runtime, and workload details.
- A conflict between “no Kubernetes” and “cluster-level Kubernetes networking” is surfaced for clarification.

### Strong preferences

- Conventional web/API hosting with code deployment, predictable traffic, and no Kubernetes requirement points to App Service.
- Multiple independently deployed or scaled containers point to Container Apps when direct Kubernetes APIs are not required.
- Containerized queue workers or container jobs can point to Container Apps; function-shaped event handlers can point to Azure Functions.
- A scheduled code task can point to Azure Functions; Container Apps Jobs remain an alternative when a container runtime or job lifecycle is important.
- Kubernetes API access plus a preference for managed infrastructure can point to AKS Automatic. AKS Standard remains an alternative when the actual feature matrix requires it.

### Optional capabilities and unknowns

- A container image does not establish a Kubernetes requirement.
- Calling a managed AI model endpoint does not imply the application hosts the model or needs a GPU.
- GPU requirements remain conditional on model/runtime compatibility, supported hardware, region, quota, networking, data needs, concurrency, and cost envelope.
- Private ingress, VNet access, and cluster-level networking are different needs. Plan and service availability must be checked.
- “Not sure” or missing details lead to alternatives or follow-up questions rather than a fabricated primary answer.

### Existing applications and dependencies

- New builds, migrations, and modernization are distinct contexts. Existing runtime versions, deployment assets, files, plugins, networking, and OS-level assumptions are reviewed before suggesting a hosting path.
- A current VM deployment does not by itself require a destination VM. A confirmed need for guest-OS, root, or server-level control makes Azure Virtual Machines a conditional candidate and calls out the team's OS patching, hardening, monitoring, availability, backup, and recovery responsibilities.
- Unsupported runtimes or native dependencies require validation. They do not automatically force either a VM or Kubernetes; compare supported application runtimes, custom containers, and VMs against the actual dependency.
- Database presence, engine, location, and connection behavior are separate application constraints. They add compatibility, networking, latency, pooling, and migration checks without selecting compute.
- WordPress is treated as a PHP web workload. Its native database requirement is MySQL or MariaDB, not Azure SQL. A MariaDB-to-MySQL destination is conditional on version, SQL behavior, schema, collation, plugin, driver, and migration/restore testing.
- Database connection pressure is called out when a database-backed application may scale out or has variable/event-driven demand. Connection pooling and database limits remain workload-specific validation.
- Persistent files and private connectivity are explicit concerns. The result directs teams to validate storage paths, multi-instance behavior, network direction, DNS, and service-plan support.

### Assessment flow and answer state

- The first questions establish lifecycle and application purpose. Technology, current deployment, database, execution, Kubernetes, and special requirements appear only when relevant.
- Multi-select answers are used for component combinations, execution patterns, technical constraints, and priorities. “None” and “Not sure” options are exclusive within their question.
- Progress, step navigation, and the requirement brief are derived from currently visible questions. Changing an earlier answer removes answers to newly irrelevant questions but retains answers that remain on the active path.
- The copied summary contains only categorical answers, the compute outcome, and architecture considerations; no free-text application details are collected.

## Service rationale

Service descriptions and operational considerations are maintained in `src/data/services.js`. The application links each candidate to its Microsoft Learn overview. `docs/references.md` records sources and verification date.

## Review checklist for a rule change

1. Link the proposed rule to current official service documentation.
2. Decide whether the requirement is a hard constraint, preference, optional capability, or unknown.
3. Add a test for the expected candidate and for a nearby case that should not trigger it.
4. Update the article if the underlying architectural guidance changes.
5. Record region, plan, quota, and preview/GA limitations where they affect the claim.

const questions = [
  {
    key: "stage",
    topic: "Project context",
    title: "Where are you in the application lifecycle?",
    help: "A new application and an existing system bring different constraints. This describes context, not a hosting recommendation.",
    options: [
      { value: "new", label: "Building a new application", description: "There is no existing deployment to preserve." },
      { value: "migrate", label: "Moving an existing application", description: "The application already runs somewhere and must be moved." },
      { value: "modernize", label: "Modernizing an existing application", description: "The application may change as part of the move." },
      { value: "exploring", label: "Exploring or still deciding", description: "I am mapping options before committing to a project." },
    ],
  },
  {
    key: "workloads",
    topic: "Application purpose",
    title: "What does the application do?",
    help: "Select every workload that is part of the design. Choose “Not sure” if the purpose or boundaries are still unclear.",
    multiple: true,
    options: [
      { value: "website", label: "Website or web application", description: "Serves interactive pages or HTTP requests." },
      { value: "api", label: "API or backend service", description: "Serves application or integration requests." },
      { value: "wordpress", label: "WordPress site", description: "A PHP application with a MySQL- or MariaDB-compatible database dependency." },
      { value: "cms", label: "Another content-management system", description: "A CMS whose runtime, extensions, and storage needs need checking." },
      { value: "worker", label: "Background worker", description: "Processes messages, batches, or work outside the request path." },
      { value: "scheduled", label: "Scheduled task", description: "Runs on a timer or schedule, then completes." },
      { value: "event", label: "Event-triggered function", description: "Runs in response to a supported event or message." },
      { value: "multi", label: "Several independently managed components", description: "Components need separate deployment, scaling, or lifecycle boundaries." },
      { value: "ai-app", label: "Application that calls a managed AI endpoint", description: "The model is hosted elsewhere; this application sends requests to it." },
      { value: "model", label: "Application that hosts its own model", description: "The model runs inside the workload and may need specialized compute." },
      { value: "kubernetes", label: "Existing Kubernetes workload", description: "The deployment currently uses Kubernetes or Kubernetes-native tooling." },
      { value: "static", label: "Static frontend", description: "HTML, CSS, JavaScript, and assets without a continuously running server." },
      { value: "other", label: "Another application pattern", description: "The workload needs a closer look before a platform can be shortlisted." },
      { value: "unsure", label: "Not sure yet", description: "We will keep the result provisional rather than force a guess." },
    ],
  },
  {
    key: "technology",
    topic: "Runtime and framework",
    title: "Which application technologies are involved?",
    help: "Select all that apply. A technology or container image does not by itself determine the hosting service.",
    multiple: true,
    options: [
      { value: "dotnet", label: ".NET / ASP.NET Core", description: "Include the target framework and runtime version when you validate platform support." },
      { value: "php", label: "PHP", description: "Check the supported PHP version, extensions, and application write paths." },
      { value: "python", label: "Python", description: "Check interpreter, native dependencies, and process model." },
      { value: "node", label: "Node.js", description: "Check Node.js version, build, and startup requirements." },
      { value: "java", label: "Java", description: "Check JDK version, server, and packaging requirements." },
      { value: "container", label: "Existing container image", description: "A packaging choice; it is not automatically a Kubernetes requirement." },
      { value: "other", label: "Another or custom runtime", description: "Verify whether the required runtime can run on a managed application platform." },
      { value: "unsure", label: "Not sure", description: "Identify the runtime and version before finalizing a migration path." },
    ],
  },
  {
    key: "existingAssets",
    topic: "Current deployment",
    title: "What is already part of the existing deployment?",
    help: "Select the closest current deployment model. Running on a VM alone does not mean the VM must be retained.",
    options: [
      { value: "vm", label: "Virtual machine or shared host", description: "The app runs on a server whose OS or hosting environment may be customized." },
      { value: "container", label: "One or more containers", description: "The app is already packaged as a container." },
      { value: "kubernetes", label: "Kubernetes cluster", description: "Manifests, Helm, or cluster integrations may be involved." },
      { value: "managed", label: "Managed application platform", description: "The app already runs on a managed web or function service." },
      { value: "other", label: "Another deployment model", description: "Describe the dependencies through the requirements below." },
      { value: "unsure", label: "Not sure", description: "The current platform is not yet confirmed." },
    ],
  },
  {
    key: "database",
    topic: "Data dependencies",
    title: "Does the application use or require a database?",
    help: "This records an application dependency. The database answer does not select the compute service.",
    options: [
      { value: "yes", label: "Yes", description: "The application needs an existing or planned database." },
      { value: "no", label: "No", description: "No database is part of this workload." },
      { value: "unsure", label: "Not sure", description: "The data model or dependency is still being established." },
    ],
  },
  {
    key: "databaseEngine",
    topic: "Database compatibility",
    title: "Which database engine does the application use?",
    help: "Choose the current or intended engine. Compatibility and migration are separate workstreams from compute hosting.",
    options: [
      { value: "sql-server", label: "SQL Server / Azure SQL", description: "Validate driver, version, authentication, and network compatibility." },
      { value: "mysql", label: "MySQL", description: "Validate server version, schema, connectivity, and migration approach." },
      { value: "mariadb", label: "MariaDB", description: "Validate version, SQL behavior, schema, collation, and target compatibility." },
      { value: "postgresql", label: "PostgreSQL", description: "Validate extensions, server version, connectivity, and migration approach." },
      { value: "mongodb", label: "MongoDB-compatible database", description: "Validate API/feature compatibility and application drivers." },
      { value: "other", label: "Another database engine", description: "Record the exact product and version during architecture review." },
      { value: "unsure", label: "Not sure", description: "Confirm the current engine and version before planning migration." },
    ],
  },
  {
    key: "databaseLocation",
    topic: "Database location",
    title: "Where is the database, or where is it expected to run?",
    help: "The compute service and database are separate decisions. The app still needs an appropriate network path and compatible client configuration.",
    options: [
      { value: "onprem", label: "On-premises or private datacenter", description: "Private connectivity, DNS, latency, and availability need review." },
      { value: "other-cloud", label: "Another cloud or external provider", description: "Review secure connectivity, latency, egress, and dependency availability." },
      { value: "azure", label: "Already in Azure", description: "Confirm the network path, authentication, and target service constraints." },
      { value: "move-to-azure", label: "Planning to move it to Azure", description: "Assess database migration independently from the application hosting choice." },
      { value: "undecided", label: "Not chosen yet", description: "Keep both hosting decisions open until compatibility and data needs are clear." },
      { value: "unsure", label: "Not sure", description: "Confirm the database owner and network boundary." },
    ],
  },
  {
    key: "execution",
    topic: "Execution pattern",
    title: "How does the application perform its work?",
    help: "Select all patterns that apply. This helps distinguish a request-serving app from event handlers, jobs, and independently scaled workers.",
    multiple: true,
    options: [
      { value: "http", label: "HTTP requests", description: "A web app or API responds to incoming requests." },
      { value: "queue", label: "Queue or message processing", description: "Work is consumed asynchronously from a queue or message source." },
      { value: "schedule", label: "Timer or scheduled execution", description: "A task starts on a schedule and can finish." },
      { value: "events", label: "Other event triggers", description: "A supported event starts discrete execution." },
      { value: "continuous", label: "Continuous background process", description: "A process stays active to perform ongoing work." },
      { value: "unsure", label: "Not sure", description: "Clarify triggers, process duration, retries, and state before choosing." },
    ],
  },
  {
    key: "demand",
    topic: "Demand profile",
    title: "How does demand or runtime vary?",
    help: "This is a scaling preference, not a hard platform requirement. Scale-to-zero behavior depends on service, plan, and rule configuration.",
    options: [
      { value: "steady", label: "Mostly steady", description: "A predictable baseline of requests or work." },
      { value: "variable", label: "Variable or bursty", description: "Demand changes enough that scaling behavior matters." },
      { value: "event-driven", label: "Driven by events or queue depth", description: "Work arrives asynchronously and may come in bursts." },
      { value: "short-lived", label: "Intermittent, short-lived tasks", description: "Work runs at intervals or when triggered, then exits." },
      { value: "unsure", label: "Not sure", description: "Use observed traffic and job duration to refine the platform choice." },
    ],
  },
  {
    key: "kubernetesNeeds",
    topic: "Kubernetes dependencies",
    title: "Which Kubernetes interfaces or ecosystem tools are required?",
    help: "Only select requirements the application or deployment genuinely depends on. A Docker image alone does not require Kubernetes.",
    multiple: true,
    options: [
      { value: "api", label: "Kubernetes API or manifests", description: "Deployments, services, or integrations directly use Kubernetes APIs." },
      { value: "helm", label: "Helm charts", description: "A chart requires Kubernetes resources or cluster-level capabilities." },
      { value: "operator", label: "Operator or custom resource", description: "An operator/controller or CRD must run against the cluster API." },
      { value: "cluster", label: "Cluster-level configuration", description: "A required feature needs supported cluster, node, or network customization." },
      { value: "none", label: "No Kubernetes-specific dependency", description: "Containers may still run on a managed platform without Kubernetes APIs." },
      { value: "unsure", label: "Not sure", description: "Check required integrations and resources before treating Kubernetes as a constraint." },
    ],
  },
  {
    key: "special",
    topic: "Special requirements",
    title: "Are there other technical requirements to preserve?",
    help: "Select any hard requirements or known concerns. Distinguish a required capability from a preference during design review.",
    multiple: true,
    options: [
      { value: "os-admin", label: "Guest OS, root, or server-level control", description: "The application needs OS administration, privileged access, or unsupported server customization." },
      { value: "custom-runtime", label: "Unsupported runtime or native dependency", description: "A required runtime, extension, or native package may not fit the managed platform." },
      { value: "private-ingress", label: "Private-only inbound access", description: "The application must not accept direct public internet traffic." },
      { value: "private-backend", label: "Access to private backend resources", description: "The app must reach a private database or internal service." },
      { value: "onprem", label: "On-premises connectivity", description: "The app needs a secure network path to a private datacenter or existing system." },
      { value: "persistent-files", label: "Application-managed files or shared storage", description: "Uploads, plugins, generated files, or shared writes need a durable storage design." },
      { value: "gpu", label: "GPU for a self-hosted model", description: "The workload hosts the model; GPU type, region, quota, and runtime still need verification." },
      { value: "none", label: "No additional requirement identified", description: "The listed requirements do not add another known platform constraint." },
      { value: "unsure", label: "Not sure", description: "Keep the result provisional until the requirement is checked." },
    ],
  },
  {
    key: "connectionScaling",
    topic: "Database connection behavior",
    title: "Could application scale-out create database connection pressure?",
    help: "Independent replicas can multiply concurrent connections. Check the database's connection limits, pooling, retries, and scaling behavior.",
    options: [
      { value: "yes", label: "Yes, or likely", description: "Connection pooling and database capacity should be part of the design." },
      { value: "no", label: "No known pressure", description: "Still verify limits and pooling under representative load." },
      { value: "unsure", label: "Not sure", description: "Measure connection behavior and validate database limits before scaling out." },
    ],
  },
  {
    key: "priorities",
    topic: "Team priorities",
    title: "What should the hosting choice prioritize?",
    help: "Choose all that matter. Priorities guide comparisons but do not override a hard technical requirement.",
    multiple: true,
    options: [
      { value: "low-ops", label: "Less infrastructure to operate", description: "Prefer managed operations when the required capabilities are available." },
      { value: "cost", label: "Cost visibility and efficiency", description: "Compare plan minimums, scaling, data transfer, and supporting services." },
      { value: "scale", label: "Scaling flexibility", description: "Match scaling behavior to observed demand and execution patterns." },
      { value: "control", label: "Platform or OS control", description: "Accept additional administration where a requirement justifies it." },
      { value: "team", label: "Fit with team skills and operations", description: "Choose a model the team can deploy, secure, observe, and support." },
      { value: "compatibility", label: "Preserve application compatibility", description: "Prioritize runtime, plugin, dependency, and migration validation." },
      { value: "availability", label: "Availability and recovery", description: "Design redundancy, backup, recovery, and failure handling explicitly." },
      { value: "unsure", label: "No priority chosen yet", description: "Keep the result focused on technical fit and unresolved constraints." },
    ],
  },
];

const questionByKey = Object.fromEntries(questions.map((question) => [question.key, question]));

const has = (values, ...choices) => choices.some((choice) => values.includes(choice));

export function createInitialAnswers() {
  return Object.fromEntries(questions.map(({ key, multiple }) => [key, multiple ? [] : ""]));
}

export function getVisibleQuestions(answers) {
  const workloads = Array.isArray(answers.workloads) ? answers.workloads : [];
  const application = has(workloads, "website", "api", "wordpress", "cms", "worker", "scheduled", "event", "multi", "ai-app", "model");
  const staticOnly = workloads.length === 1 && workloads[0] === "static";
  const technologyRelevant = has(workloads, "website", "api", "cms", "multi", "ai-app", "model")
    && !(workloads.length === 1 && workloads[0] === "wordpress");
  const migration = ["migrate", "modernize"].includes(answers.stage);
  const database = application && answers.database === "yes";
  const kubernetesDeployment = has(workloads, "kubernetes") || answers.existingAssets === "kubernetes";

  const visible = questions.filter(({ key }) => {
    if (key === "technology") return technologyRelevant;
    if (key === "existingAssets") return migration && (application || workloads.includes("kubernetes"));
    if (key === "database") return application;
    if (key === "databaseEngine" || key === "databaseLocation") return database;
    if (key === "execution") return application;
    if (key === "demand") return application && !has(workloads, "scheduled") || (application && workloads.length > 1);
    if (key === "kubernetesNeeds") return kubernetesDeployment;
    if (key === "special") return workloads.length > 0 && !workloads.some((item) => ["unsure", "other"].includes(item));
    if (key === "connectionScaling") return database && application;
    if (key === "priorities") return workloads.length > 0 && !workloads.includes("unsure");
    return true;
  }).map((question) => {
    if (question.key !== "special") return questionByKey[question.key];
    const relevant = staticOnly
      ? new Set(["private-ingress", "none", "unsure"])
      : new Set([
        "private-ingress", "private-backend", "onprem", "none", "unsure",
        ...(has(workloads, "website", "wordpress", "cms", "api") ? ["persistent-files"] : []),
        ...(workloads.includes("model") ? ["gpu"] : []),
        ...(application ? ["os-admin", "custom-runtime"] : []),
      ]);
    return {
      ...questionByKey.special,
      options: questionByKey.special.options.filter(({ value }) => relevant.has(value)),
    };
  });
  return visible;
}

export function clearHiddenAnswers(answers, visibleQuestions) {
  const visible = new Set(visibleQuestions.map(({ key }) => key));
  for (const question of questions) {
    if (!visible.has(question.key)) answers[question.key] = question.multiple ? [] : "";
  }
}

export function formatAnswer(question, answer) {
  if (question.multiple) {
    const labels = answer.map((value) => question.options.find((option) => option.value === value)?.label).filter(Boolean);
    return labels.join(", ");
  }
  return question.options.find((option) => option.value === answer)?.label ?? "";
}

export const assessmentQuestions = questions;

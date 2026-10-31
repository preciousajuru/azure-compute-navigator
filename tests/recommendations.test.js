import test from "node:test";
import assert from "node:assert/strict";
import { formatAssessmentSummary, recommend } from "../src/logic/recommendations.js";

const answers = (overrides = {}) => ({
  workload: "web-api",
  deployment: "source",
  kubernetes: "none",
  scaling: "steady",
  gpu: "none",
  networking: "public",
  operations: "minimal",
  ...overrides,
});

test("a conventional API without Kubernetes needs can start with App Service", () => {
  const result = recommend(answers());
  assert.equal(result.status, "recommendation");
  assert.equal(result.primary, "app-service");
  assert.ok(result.candidates.some((item) => item.service.id === "container-apps"));
});

test("using a container image does not automatically recommend AKS", () => {
  const result = recommend(answers({ deployment: "container" }));
  assert.equal(result.primary, null);
  assert.ok(result.candidates.some((item) => item.service.id === "app-service"));
  assert.ok(result.candidates.some((item) => item.service.id === "container-apps"));
  assert.ok(!result.candidates.some((item) => item.service.id.startsWith("aks-")));
});

test("an application calling a managed model endpoint is not treated as GPU hosting", () => {
  const result = recommend(answers({
    workload: "ai-api",
    gpu: "managed-endpoint",
  }));
  assert.equal(result.status, "shortlist");
  assert.equal(result.primary, null);
  assert.ok(result.candidates.some((item) => item.service.id === "app-service"));
  assert.ok(result.candidates.some((item) => item.service.id === "container-apps"));
  assert.ok(!result.candidates.some((item) => item.service.id === "aks-standard"));
  assert.ok(result.uncertainties.some((item) => item.includes("deployment model")));
});

test("queue-driven container workers can lead to Container Apps", () => {
  const result = recommend(answers({
    workload: "worker",
    deployment: "container",
    scaling: "queue",
  }));
  assert.equal(result.primary, "container-apps");
  assert.ok(result.candidates.some((item) => item.service.id === "functions"));
});

test("a scheduled code task can lead to Azure Functions", () => {
  const result = recommend(answers({
    workload: "scheduled",
    deployment: "source",
    scaling: "scheduled",
  }));
  assert.equal(result.primary, "functions");
  assert.ok(result.candidates.some((item) => item.service.id === "container-apps"));
});

test("a scheduled container job can lead to Container Apps Jobs", () => {
  const result = recommend(answers({
    workload: "scheduled",
    deployment: "container",
    scaling: "scheduled",
  }));
  assert.equal(result.primary, "container-apps");
  assert.ok(result.candidates.some((item) => item.service.id === "functions"));
});

test("Kubernetes API requirements with a managed operations preference can lead to AKS Automatic", () => {
  const result = recommend(answers({
    workload: "multi-service",
    deployment: "kubernetes",
    kubernetes: "api",
    operations: "managed-kubernetes",
  }));
  assert.equal(result.primary, "aks-automatic");
  assert.ok(result.candidates.some((item) => item.service.id === "aks-standard"));
});

test("advanced cluster requirements lead to AKS Standard, not just a container image", () => {
  const result = recommend(answers({
    workload: "multi-service",
    deployment: "kubernetes",
    kubernetes: "advanced",
    operations: "control",
  }));
  assert.equal(result.primary, "aks-standard");
});

test("GPU hosting returns a shortlist and verification questions, not an automatic AKS Standard answer", () => {
  const result = recommend(answers({
    workload: "custom-model",
    deployment: "container",
    gpu: "self-hosted",
  }));
  assert.equal(result.status, "more-info");
  assert.equal(result.primary, null);
  assert.ok(result.candidates.some((item) => item.service.id === "container-apps"));
  assert.ok(result.candidates.some((item) => item.service.id === "aks-automatic"));
  assert.ok(!result.candidates.some((item) => item.service.id === "aks-standard"));
  assert.ok(result.uncertainties.some((item) => item.includes("GPU SKU")));
});

test("a purely static frontend can lead to Static Web Apps", () => {
  const result = recommend(answers({ workload: "static", deployment: "source" }));
  assert.equal(result.primary, "static-web-apps");
});

test("a static frontend with an API returns separate component options", () => {
  const result = recommend({
    stage: "new",
    workloads: ["static", "api"],
    database: "no",
    execution: ["http"],
    demand: "steady",
    special: ["none"],
  });
  assert.equal(result.status, "shortlist");
  assert.equal(result.primary, null);
  assert.ok(result.candidates.some((item) => item.service.id === "static-web-apps"));
  assert.ok(result.candidates.some((item) => item.service.id === "app-service"));
});

test("a static-only workload with a private-ingress requirement asks for plan validation", () => {
  const result = recommend({
    stage: "new",
    workloads: ["static"],
    special: ["private-ingress"],
  });
  assert.equal(result.status, "more-info");
  assert.equal(result.primary, null);
  assert.ok(result.candidates.some((item) => item.service.id === "static-web-apps"));
});

test("missing workload information requests clarification rather than inventing a primary", () => {
  const result = recommend(answers({ workload: "unsure" }));
  assert.equal(result.status, "more-info");
  assert.equal(result.primary, null);
  assert.ok(result.uncertainties.length > 0);
});

test("contradictory cluster networking and no-Kubernetes answers are surfaced", () => {
  const result = recommend(answers({
    kubernetes: "none",
    networking: "cluster-control",
  }));
  assert.equal(result.status, "more-info");
  assert.equal(result.primary, null);
  assert.equal(result.conflicts.length, 1);
});

test("contradictory Kubernetes deployment and no-Kubernetes answers are surfaced", () => {
  const result = recommend(answers({
    deployment: "kubernetes",
    kubernetes: "none",
  }));
  assert.equal(result.status, "more-info");
  assert.equal(result.primary, null);
  assert.equal(result.conflicts.length, 1);
});

test("private ingress remains a plan-specific validation rather than a blanket capability claim", () => {
  const result = recommend(answers({ networking: "private-ingress" }));
  assert.equal(result.primary, "app-service");
  assert.ok(result.uncertainties.some((item) => item.includes("private-ingress")));
});

test("changing answers recalculates the result without a hidden score", () => {
  const conventional = recommend(answers());
  const containerizedSystem = recommend(answers({
    workload: "multi-service",
    deployment: "multi-container",
    scaling: "queue",
  }));
  assert.equal(conventional.primary, "app-service");
  assert.equal(containerizedSystem.primary, "container-apps");
  assert.equal("score" in containerizedSystem, false);
});

test("the copied summary contains only categories and the outcome", () => {
  const input = answers({ workload: "web-api" });
  const text = formatAssessmentSummary(input, recommend(input));
  assert.match(text, /Azure Compute Navigator assessment/);
  assert.match(text, /Starting point: Azure App Service/);
  assert.match(text, /Workload: Web application or REST API/);
  assert.doesNotMatch(text, /web-api|variable-http/);
  assert.doesNotMatch(text, /confidence|score/i);
});

test("WordPress with MariaDB recommends compute separately and highlights migration compatibility", () => {
  const result = recommend({
    stage: "migrate",
    workloads: ["wordpress"],
    existingAssets: "vm",
    database: "yes",
    databaseEngine: "mariadb",
    databaseLocation: "onprem",
    execution: ["http"],
    demand: "steady",
    special: ["none"],
  });
  assert.equal(result.primary, "app-service");
  assert.ok(result.candidates.some((item) => item.service.id === "virtual-machines" && item.fit === "possible"));
  assert.ok(result.considerations.some((item) => item.includes("retired on 19 September 2025")));
  assert.ok(result.considerations.some((item) => item.includes("Azure SQL as a native database replacement")));
  assert.ok(result.considerations.some((item) => item.includes("latency")));
  assert.ok(!result.candidates.some((item) => item.service.id === "azure-sql"));
});

test("a new API with Azure SQL keeps database compatibility out of the compute recommendation", () => {
  const result = recommend({
    stage: "new",
    workloads: ["api"],
    technology: ["dotnet"],
    database: "yes",
    databaseEngine: "sql-server",
    databaseLocation: "azure",
    execution: ["http"],
    demand: "steady",
    special: ["none"],
    priorities: ["low-ops"],
  });
  assert.equal(result.primary, "app-service");
  assert.ok(result.considerations.some((item) => item.includes("Database hosting is a separate decision")));
  assert.ok(result.considerations.some((item) => item.includes("network path")));
});

test("an existing VM does not force the workload to remain on a VM", () => {
  const result = recommend({
    stage: "migrate",
    workloads: ["website"],
    technology: ["php"],
    existingAssets: "vm",
    database: "no",
    execution: ["http"],
    demand: "steady",
    special: ["none"],
  });
  assert.equal(result.primary, "app-service");
  assert.ok(result.candidates.some((item) => item.service.id === "virtual-machines" && item.fit === "possible"));
});

test("a verified guest-OS requirement makes VMs primary and states the operational transfer", () => {
  const result = recommend({
    stage: "modernize",
    workloads: ["api"],
    database: "no",
    execution: ["http"],
    demand: "steady",
    special: ["os-admin"],
  });
  assert.equal(result.primary, "virtual-machines");
  assert.match(result.hardConstraints.join(" "), /Guest-OS/);
  assert.match(result.candidates[0].tradeoff, /patching/);
});

test("an unsupported runtime is investigated without automatically selecting Kubernetes", () => {
  const result = recommend({
    stage: "migrate",
    workloads: ["api"],
    technology: ["other"],
    existingAssets: "vm",
    database: "no",
    execution: ["http"],
    demand: "steady",
    special: ["custom-runtime"],
  });
  assert.equal(result.status, "more-info");
  assert.equal(result.primary, null);
  assert.ok(result.candidates.some((item) => item.service.id === "virtual-machines"));
  assert.ok(!result.candidates.some((item) => item.service.id.startsWith("aks-")));
});

test("Kubernetes API dependencies require AKS, while a containerized workload without them can use Container Apps", () => {
  const required = recommend({
    stage: "modernize",
    workloads: ["kubernetes"],
    existingAssets: "kubernetes",
    kubernetesNeeds: ["helm"],
  });
  const notRequired = recommend({
    stage: "modernize",
    workloads: ["kubernetes"],
    existingAssets: "kubernetes",
    kubernetesNeeds: ["none"],
  });
  assert.equal(required.primary, "aks-automatic");
  assert.equal(notRequired.primary, "container-apps");
});

test("an app that calls a managed AI endpoint is not classified as model hosting", () => {
  const result = recommend({
    stage: "new",
    workloads: ["ai-app"],
    database: "no",
    execution: ["http"],
    demand: "steady",
    special: ["none"],
  });
  assert.equal(result.primary, "app-service");
  assert.ok(!result.candidates.some((item) => item.service.id.startsWith("aks-")));
  assert.ok(!result.considerations.some((item) => item.toLowerCase().includes("gpu")));
});

test("database connection pressure remains an explicit architecture consideration", () => {
  const result = recommend({
    stage: "new",
    workloads: ["api"],
    database: "yes",
    databaseEngine: "mysql",
    databaseLocation: "azure",
    execution: ["http"],
    demand: "variable",
    connectionScaling: "yes",
    special: ["none"],
  });
  assert.equal(result.primary, "app-service");
  assert.ok(result.considerations.some((item) => item.includes("connection pooling")));
});

test("the assessment summary uses readable categories and includes separate migration checks", () => {
  const input = {
    stage: "migrate",
    workloads: ["wordpress"],
    database: "yes",
    databaseEngine: "mariadb",
    databaseLocation: "move-to-azure",
    execution: ["http"],
    demand: "steady",
    special: ["none"],
  };
  const result = recommend(input);
  const text = formatAssessmentSummary(input, result);
  assert.match(text, /Workloads: WordPress/);
  assert.match(text, /Database engine: MariaDB/);
  assert.match(text, /MariaDB.*retired/);
  assert.doesNotMatch(text, /move-to-azure|databaseEngine/i);
});

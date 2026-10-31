import { serviceById } from "../data/services.js";

const unknownValues = new Set([undefined, null, "", "unsure", "depends", "not-sure"]);

const answerLabels = {
  workload: {
    "web-api": "Web application or REST API",
    static: "Static frontend",
    worker: "Background worker",
    scheduled: "Scheduled task",
    "event-function": "Event-driven function",
    "multi-service": "Several independently managed services",
    "ai-api": "Application calling a managed AI endpoint",
    "custom-model": "Workload hosting its own model",
  },
  deployment: {
    source: "Application code",
    container: "Existing container image",
    "multi-container": "Multiple independently managed containers",
    kubernetes: "Kubernetes manifests, Helm, or operators",
    "no-preference": "No strong preference",
  },
  kubernetes: {
    none: "No direct Kubernetes requirement",
    api: "Kubernetes APIs or ecosystem tooling",
    advanced: "Advanced cluster customization",
  },
  scaling: {
    steady: "Predictable, continuous traffic",
    "variable-http": "Variable HTTP demand",
    queue: "Queue-based or event-driven demand",
    scheduled: "Scheduled or short-lived jobs",
    "scale-zero": "May need to scale to zero",
    "node-behavior": "Specific performance or node-level behavior",
  },
  gpu: {
    none: "No GPU requirement",
    "managed-endpoint": "Calls a managed model endpoint",
    "self-hosted": "GPU compute to run its own model",
    "specific-hardware": "Specific GPU hardware or node-level control",
  },
  networking: {
    public: "Public ingress with secure backend access",
    "private-ingress": "Private ingress only",
    "private-backend": "VNet access to private backend resources",
    "cluster-control": "Advanced Kubernetes network or cluster control",
  },
  operations: {
    minimal: "As little infrastructure management as practical",
    "managed-containers": "Managed container operations",
    "managed-kubernetes": "Kubernetes with more automated infrastructure operations",
    control: "Greater control over Kubernetes infrastructure",
  },
};

function isUnknown(value) {
  return unknownValues.has(value);
}

function candidate(id, fit, reasons, tradeoff = "") {
  return { service: serviceById[id], fit, reasons, tradeoff };
}

function result(status, primary, candidates, uncertainties = [], conflicts = []) {
  return {
    status,
    primary,
    candidates,
    uncertainties,
    conflicts,
    hardConstraints: [],
    preferences: [],
    considerations: [],
    hasPrimaryRecommendation: Boolean(primary),
  };
}

function moreInformation(input, details) {
  const candidates = details.candidates ?? [];
  return result(
    "more-info",
    null,
    candidates,
    details.uncertainties ?? [],
    details.conflicts ?? [],
  );
}

function openCandidates(input) {
  const workload = input.workload;
  const deployment = input.deployment;
  const scaling = input.scaling;

  if (workload === "static") {
    return result(
      "recommendation",
      "static-web-apps",
      [
        candidate("static-web-apps", "strong", [
          "The workload is a static frontend and does not need a continuously running server.",
          "Static Web Apps can also be paired with an API when the frontend and backend should be deployed separately.",
        ]),
      ],
    );
  }

  if (
    (workload === "scheduled" || workload === "worker") &&
    (deployment === "container" || deployment === "multi-container")
  ) {
    return result(
      "recommendation",
      "container-apps",
      [
        candidate("container-apps", "strong", [
          "The work runs as a containerized task rather than a function deployed as application code.",
          "Container Apps Jobs support on-demand, scheduled, and event-triggered job patterns.",
        ]),
        candidate("functions", "alternative", [
          "Azure Functions is worth comparing if the task can use a supported function trigger and hosting plan.",
        ]),
      ],
    );
  }

  if (workload === "scheduled" && deployment !== "container" && deployment !== "multi-container") {
    return result(
      "recommendation",
      "functions",
      [
        candidate("functions", "strong", [
          "The work is triggered by a schedule rather than requiring a continuously running service.",
          "A function app can run timer-triggered code without introducing a general-purpose container platform.",
        ]),
        candidate("container-apps", "alternative", [
          "Container Apps Jobs are worth considering if the task already ships as a container or needs container-specific runtime control.",
        ]),
      ],
    );
  }

  if (
    (workload === "event-function" || scaling === "scheduled") &&
    deployment !== "container" &&
    deployment !== "multi-container"
  ) {
    return result(
      "recommendation",
      "functions",
      [
        candidate("functions", "strong", [
          "The workload is naturally invoked by an event or schedule.",
          "Azure Functions provides trigger-based execution and hosting plans designed for function workloads.",
        ]),
        candidate("container-apps", "alternative", [
          "Container Apps Jobs can fit when you need an existing container, custom runtime, or a job lifecycle outside the function model.",
        ]),
      ],
    );
  }

  if (workload === "multi-service" || deployment === "multi-container") {
    return result(
      "recommendation",
      "container-apps",
      [
        candidate("container-apps", "strong", [
          "The application has multiple containerized components that benefit from independent deployment or scaling.",
          "Container Apps provides managed ingress, revisions, jobs, and event-driven scaling without requiring direct Kubernetes operations.",
        ]),
        candidate("app-service", "alternative", [
          "App Service remains an option for web-facing components or containerized web apps when its plan capabilities meet the design.",
        ]),
      ],
    );
  }

  if (workload === "worker" && (scaling === "queue" || scaling === "scale-zero")) {
    if (deployment === "container" || deployment === "multi-container") {
      return result(
        "recommendation",
        "container-apps",
        [
          candidate("container-apps", "strong", [
            "The worker is containerized and demand is event-driven.",
            "Container Apps supports jobs and KEDA-backed event scaling; scale-to-zero behavior depends on the selected configuration.",
          ]),
          candidate("functions", "alternative", [
            "Azure Functions may be simpler if the work can be expressed as event-triggered function code.",
          ]),
        ],
      );
    }
    return result(
      "shortlist",
      null,
      [
        candidate("functions", "strong", [
          "An event-triggered function can fit discrete queue messages or other supported events.",
        ]),
        candidate("container-apps", "strong", [
          "A managed container app or job can fit a worker that needs a container process or more control over its runtime.",
        ]),
      ],
      ["Whether this is function-shaped work or a continuously running/containerized worker."],
    );
  }

  if (deployment === "multi-container") {
    return result(
      "recommendation",
      "container-apps",
      [
        candidate("container-apps", "strong", [
          "The deployment includes multiple independently managed containers.",
          "Container Apps is designed for managed container application patterns without exposing a Kubernetes API.",
        ]),
      ],
    );
  }

  if (
    workload === "web-api" &&
    (deployment === "source" || deployment === "no-preference") &&
    (scaling === "steady" || scaling === "variable-http" || isUnknown(scaling))
  ) {
    const appService = candidate("app-service", "strong", [
      "This is a conventional web application or REST API.",
      "No Kubernetes API, cluster customization, or independent multi-service scaling requirement has been identified.",
      "App Service can host supported application stacks and custom containers.",
    ]);
    const containerApps = candidate("container-apps", "alternative", [
      "Container Apps is worth comparing if the design needs container revisions, event-driven scaling, jobs, or service-to-service patterns.",
    ]);
    if (isUnknown(scaling)) {
      return result("shortlist", null, [appService, containerApps], [
        "Whether traffic is steady, bursty, or event-driven can affect the preferred scaling model.",
      ]);
    }
    return result("recommendation", "app-service", [appService, containerApps]);
  }

  if (
    (workload === "web-api" || workload === "ai-api") &&
    (deployment === "container" || deployment === "no-preference")
  ) {
    if (scaling === "scale-zero" || scaling === "queue" || scaling === "variable-http") {
      return result(
        "recommendation",
        "container-apps",
        [
          candidate("container-apps", "strong", [
            "The workload uses containers and its scaling behavior benefits from managed container revisions or event/HTTP-driven scaling.",
            "Calling a managed AI endpoint does not itself require a GPU or determine the hosting service.",
          ]),
          candidate("app-service", "alternative", [
            "App Service can also host custom containers where a conventional web-app operating model is preferred.",
          ]),
        ],
      );
    }
    return result(
      "shortlist",
      null,
      [
        candidate("app-service", "strong", [
          "App Service can host a conventional web API, including supported custom containers.",
          "A managed model API call does not mean the application hosts the model or needs a GPU.",
        ]),
        candidate("container-apps", "strong", [
          "Container Apps is an alternative when container revisions, jobs, or independent service scaling matter.",
        ]),
      ],
      ["Whether the container is a single web app or part of an independently scaled service system."],
    );
  }

  if (workload === "ai-api") {
    return result(
      "shortlist",
      null,
      [
        candidate("app-service", "strong", [
          "A web application that calls a managed model endpoint can use ordinary web hosting.",
          "The model runs outside this application, so the endpoint call alone does not create a GPU requirement.",
        ]),
        candidate("container-apps", "strong", [
          "Choose this path when the application is containerized or has independently scaled services, workers, or jobs.",
        ]),
      ],
      ["The application's deployment model and whether it is one web service or several independently scaled components."],
    );
  }

  if (workload === "unsure" || isUnknown(workload)) {
    return moreInformation(input, {
      uncertainties: ["What the workload does and whether it is a web service, static frontend, event handler, worker, or multi-service application."],
    });
  }

  if (workload === "custom-model") {
    return moreInformation(input, {
      uncertainties: ["Whether the model needs a GPU, its required GPU class, expected concurrency, region, and runtime constraints."],
      candidates: [
        candidate("container-apps", "possible", [
          "Container Apps offers on-demand serverless GPU and dedicated GPU profile options, with regional and workload limitations to verify.",
        ]),
        candidate("aks-automatic", "possible", [
          "AKS Automatic is a documented production-ready starting point for many GPU workloads that need Kubernetes.",
        ]),
        candidate("aks-standard", "possible", [
          "AKS Standard can be considered when GPU hosting also requires cluster or node-pool customization.",
        ]),
      ],
    });
  }

  return moreInformation(input, {
    uncertainties: ["More detail about deployment shape, Kubernetes requirements, and scaling is needed to distinguish the viable options."],
  });
}

function recommendInternal(input = {}) {
  if (Array.isArray(input.workloads)) {
    return recommendAdaptive(input);
  }

  const workload = input.workload;
  const kubernetes = input.kubernetes;
  const networking = input.networking;
  const gpu = input.gpu;
  const operations = input.operations;
  const deployment = input.deployment;

  if (workload === "static" && networking === "private-ingress") {
    return moreInformation(input, {
      uncertainties: [
        "Verify whether Static Web Apps can meet the required private-ingress boundary for the selected plan and architecture; compare a web-hosting service if it cannot.",
      ],
      candidates: [
        candidate("static-web-apps", "possible", [
          "The frontend is static, but the stated ingress boundary needs service- and plan-specific validation.",
        ]),
        candidate("app-service", "possible", [
          "App Service has inbound private-access options for supported configurations; verify the plan and topology.",
        ]),
      ],
    });
  }

  if (networking === "cluster-control" && kubernetes === "none") {
    return moreInformation(input, {
      conflicts: [
        "The assessment says Kubernetes is not needed but also asks for cluster-level networking control. Confirm whether Kubernetes is a firm platform requirement.",
      ],
      candidates: [
        candidate("container-apps", "possible", [
          "Container Apps can integrate with an existing virtual network, but it does not expose Kubernetes cluster networking controls.",
        ]),
        candidate("aks-standard", "possible", [
          "AKS Standard is worth evaluating if the requirement truly is for Kubernetes cluster-level network configuration.",
        ]),
      ],
    });
  }

  if (deployment === "kubernetes" && kubernetes === "none") {
    return moreInformation(input, {
      conflicts: [
        "The assessment says Kubernetes is not needed but also selects Kubernetes manifests, Helm, or operators. Confirm whether those tools are a hard requirement.",
      ],
      candidates: [
        candidate("aks-automatic", "possible", [
          "AKS Automatic fits if Kubernetes APIs are required and its supported configuration is sufficient.",
        ]),
        candidate("aks-standard", "possible", [
          "AKS Standard is worth evaluating if the workload also needs additional cluster-level control.",
        ]),
        candidate("container-apps", "possible", [
          "Container Apps can run containers when the Kubernetes-specific deployment interface is not essential.",
        ]),
      ],
    });
  }

  if (kubernetes === "advanced" || networking === "cluster-control") {
    return result(
      "recommendation",
      "aks-standard",
      [
        candidate("aks-standard", "strong", [
          "The workload explicitly requires advanced Kubernetes or cluster-level customization.",
          "AKS Standard provides more configurable cluster and node-pool choices than the Automatic operating model.",
        ]),
        candidate("aks-automatic", "alternative", [
          "Check the current Automatic feature matrix: some Kubernetes requirements may be supported with less infrastructure management.",
        ]),
      ],
      ["Verify the exact Kubernetes feature, region, network design, quota, and operations model before implementation."],
    );
  }

  if (kubernetes === "api" || deployment === "kubernetes") {
    if (operations === "control") {
      return result(
        "recommendation",
        "aks-standard",
        [
          candidate("aks-standard", "strong", [
            "Direct Kubernetes APIs, Helm, or Kubernetes-native ecosystem tooling are explicit requirements.",
            "The team also prefers greater infrastructure control.",
          ]),
          candidate("aks-automatic", "alternative", [
            "AKS Automatic retains Kubernetes APIs while automating more cluster operations, if its supported configuration is sufficient.",
          ]),
        ],
      );
    }

    if (operations === "managed-kubernetes" || operations === "minimal" || isUnknown(operations)) {
      const auto = candidate("aks-automatic", "strong", [
        "Kubernetes API access is an explicit requirement.",
        "AKS Automatic preserves the Kubernetes ecosystem while managing more cluster setup and node operations.",
      ]);
      const standard = candidate("aks-standard", "alternative", [
        "AKS Standard remains an option if a specific integration, feature, region, or customization is not supported by Automatic.",
      ]);
      if (isUnknown(operations) || isUnknown(kubernetes)) {
        return result(
          "shortlist",
          null,
          [auto, standard],
          ["The team's desired level of cluster control and the exact integrations or Kubernetes features required."],
        );
      }
      return result("recommendation", "aks-automatic", [auto, standard], [
        "Confirm that the required Kubernetes ecosystem components and configuration are supported in the target region.",
      ]);
    }
  }

  if (!isUnknown(gpu) && gpu !== "none" && gpu !== "managed-endpoint") {
    const exactHardware = gpu === "specific-hardware";
    const gpuCandidates = [
      candidate("container-apps", "possible", [
        "Container Apps has serverless Consumption GPU and Dedicated GPU profile options, but hardware types, regions, quota, and workload limits must be checked.",
      ]),
      candidate("aks-automatic", "possible", [
        "Microsoft documents AKS Automatic as a production-ready default for many GPU workloads that need Kubernetes.",
      ]),
    ];
    if (exactHardware || operations === "control" || networking === "cluster-control") {
      gpuCandidates.push(candidate("aks-standard", "possible", [
        "AKS Standard may fit when the required GPU SKU or workload also needs custom node-pool, scheduling, or cluster control.",
      ]));
    }
    return moreInformation(input, {
      uncertainties: [
        "The required GPU SKU, region, quota, framework/runtime compatibility, memory, throughput, concurrency, and cost envelope.",
        exactHardware
          ? "Whether the requirement is for one specific GPU hardware profile or for node-level scheduling and lifecycle control."
          : "Whether a managed GPU profile is sufficient or a Kubernetes operating model is required.",
      ],
      candidates: gpuCandidates,
    });
  }

  if (kubernetes === "unsure" || isUnknown(kubernetes)) {
    const candidates = [];
    if (workload === "web-api" || workload === "ai-api") {
      candidates.push(candidate("app-service", "possible", [
        "A conventional web application may not need Kubernetes.",
      ]));
      candidates.push(candidate("container-apps", "possible", [
        "A containerized or event-driven application may fit without exposing a Kubernetes API.",
      ]));
    }
    return moreInformation(input, {
      uncertainties: [
        "Whether a dependency actually requires direct Kubernetes API access, Helm with cluster-level integrations, operators, or custom resource definitions.",
      ],
      candidates,
    });
  }

  const basic = openCandidates(input);
  if (basic.primary && !isUnknown(workload)) {
    return basic;
  }
  if (basic.status !== "more-info") {
    const requiredUnknowns = [];
    if (isUnknown(workload)) requiredUnknowns.push("What kind of workload is being deployed.");
    if (isUnknown(deployment)) requiredUnknowns.push("Whether the workload is deployed as code, a container, or Kubernetes resources.");
    if (isUnknown(input.scaling)) requiredUnknowns.push("How demand and runtime duration affect scaling.");
    if (requiredUnknowns.length) {
      return result(
        "shortlist",
        null,
        basic.candidates,
        [...basic.uncertainties, ...requiredUnknowns],
        basic.conflicts,
      );
    }
  }
  return basic;
}

function addReviewNotes(input, recommendation) {
  const notes = [...recommendation.uncertainties];
  if (!Array.isArray(input.workloads)) {
    if (input.networking === "private-ingress") {
      notes.push("Validate the selected service's private-ingress approach, plan/tier, and inbound network path.");
    } else if (input.networking === "private-backend") {
      notes.push("Validate outbound VNet access, private endpoint routing, DNS, and plan/environment requirements for the chosen service.");
    } else if (isUnknown(input.networking)) {
      notes.push("Confirm whether ingress must be private and whether the app must reach private backend resources.");
    }
    if (input.gpu === "unsure") {
      notes.push("Confirm whether this workload hosts its own model or calls a managed endpoint, and whether it truly needs GPU compute.");
    }
    if (input.operations === "depends") {
      notes.push("Decide which infrastructure and application operations the team is prepared to own.");
    }
  }
  const considerations = [...(recommendation.considerations ?? [])];
  const preferences = Array.isArray(input.priorities)
    ? input.priorities.filter((value) => value !== "unsure").map((value) => ({
      "low-ops": "Less infrastructure to operate",
      cost: "Cost visibility and efficiency",
      scale: "Scaling flexibility",
      control: "Platform or OS control",
      team: "Fit with team skills and operations",
      compatibility: "Preserve application compatibility",
      availability: "Availability and recovery",
    }[value] ?? value))
    : recommendation.preferences ?? [];
  if (Array.isArray(input.workloads)) {
    const workloads = input.workloads;
    const special = Array.isArray(input.special) ? input.special : [];
    if (input.database === "yes") {
      considerations.push("Database hosting is a separate decision from compute. Validate the application driver, credentials, network path, latency, availability, and database service limits.");
      if (["onprem", "other-cloud"].includes(input.databaseLocation)) {
        considerations.push("The database is outside Azure: plan secure connectivity, DNS, latency, egress, and failure behavior between the application and database.");
      } else if (input.databaseLocation === "move-to-azure") {
        considerations.push("Plan and test database migration separately from the application move; do not infer a database product from the compute recommendation.");
      }
      if (["yes", "unsure"].includes(input.connectionScaling)) {
        considerations.push("Check connection pooling, concurrent-connection limits, retries, and database capacity as application replicas scale.");
      }
      if (workloads.includes("wordpress") && input.databaseEngine === "mariadb") {
        considerations.push("WordPress supports MySQL or MariaDB, not Azure SQL as a native database replacement. Azure Database for MariaDB retired on 19 September 2025; assess Azure Database for MySQL Flexible Server only after testing MariaDB/MySQL version, SQL behavior, schema, collation, plugins, and the migration/restore process.");
      } else if (workloads.includes("wordpress") && !["mysql", "mariadb", "unsure"].includes(input.databaseEngine)) {
        considerations.push("WordPress expects a MySQL- or MariaDB-compatible database. Do not treat another engine, including Azure SQL, as a drop-in replacement; verify the current source database and any migration plugin separately.");
      } else if (workloads.includes("wordpress") && input.databaseEngine === "unsure") {
        considerations.push("Confirm the WordPress database engine and version. WordPress expects MySQL or MariaDB; do not assume Azure SQL is a native replacement.");
      }
    } else if (workloads.includes("wordpress")) {
      considerations.push("WordPress requires a MySQL- or MariaDB-compatible database. Reconcile the no/unknown database answer before treating the architecture as viable.");
    } else if (input.database === "unsure") {
      considerations.push("Confirm whether the application has a database dependency before finalizing connectivity, scaling, backup, and availability decisions.");
    }
    if (workloads.includes("wordpress")) {
      considerations.push("WordPress currently recommends PHP 8.3 or later and MariaDB 10.11 or later or MySQL 8.0 or later. Validate PHP extensions, plugin/theme behavior, writable paths, uploads, and shared-file needs against the selected host; App Service may suit the web tier when those requirements fit.");
    }
    if (special.includes("persistent-files")) {
      considerations.push("Map every upload, generated file, plugin write, and shared-write path to durable storage; confirm persistence and multi-instance behavior for the selected hosting model.");
    }
    if (input.databaseLocation === "unsure" || input.databaseEngine === "unsure") {
      notes.push("Confirm the database engine/version and hosting location before validating connectivity and migration compatibility.");
    }
    if (special.includes("unsure")) {
      notes.push("Confirm whether the application needs a particular OS, native dependency, private network path, GPU, or durable/shared file storage.");
    }
  }
  return {
    ...recommendation,
    uncertainties: [...new Set(notes)],
    preferences,
    considerations: [...new Set(considerations)],
  };
}

function recommendAdaptive(input) {
  const workloads = input.workloads;
  const technology = Array.isArray(input.technology) ? input.technology : [];
  const special = Array.isArray(input.special) ? input.special : [];
  const kubernetesNeeds = Array.isArray(input.kubernetesNeeds) ? input.kubernetesNeeds : [];
  const execution = Array.isArray(input.execution) ? input.execution : [];
  const containerized = technology.includes("container") || ["container", "kubernetes"].includes(input.existingAssets);
  const modelHosted = workloads.includes("model");
  const staticOnly = workloads.length === 1 && workloads[0] === "static";

  if (!workloads.length || workloads.includes("unsure") || workloads.includes("other")) {
    return moreInformation(input, {
      uncertainties: ["Clarify the application's purpose, runtime, and execution pattern before choosing a hosting model."],
    });
  }

  if (staticOnly) {
    if (special.includes("private-ingress")) {
      return moreInformation(input, {
        uncertainties: ["Verify that the selected Static Web Apps plan and deployment model meet the required private-ingress boundary."],
        candidates: [
          candidate("static-web-apps", "possible", ["The frontend is static, but private-ingress support needs service- and plan-specific validation."]),
          candidate("app-service", "possible", ["App Service may be an alternative if its supported inbound private-access configuration fits the site."]),
        ],
      });
    }
    const recommendation = result("recommendation", "static-web-apps", [
      candidate("static-web-apps", "strong", [
        "The selected workload is a static frontend with no continuously running application server.",
        "The frontend can be hosted separately from an API or backend when the architecture calls for it.",
      ]),
    ]);
    if (special.includes("unsure")) {
      recommendation.uncertainties.push("Confirm whether the frontend has a private-ingress requirement and validate it against the selected Static Web Apps plan.");
    }
    return recommendation;
  }

  if (workloads.includes("static")) {
    const components = [
      candidate("static-web-apps", "strong", ["The static frontend can be deployed separately from its application server or API."]),
    ];
    if (workloads.some((item) => ["website", "api", "wordpress", "cms", "ai-app"].includes(item))) {
      components.push(candidate("app-service", "strong", ["A conventional web or API component can be assessed independently from the static frontend."]));
    }
    if (workloads.some((item) => ["worker", "event", "scheduled"].includes(item))) {
      components.push(candidate("functions", "possible", ["A discrete worker, event handler, or scheduled component may fit a supported Functions trigger model."]));
    }
    if (workloads.includes("multi") || workloads.includes("worker")) {
      components.push(candidate("container-apps", "possible", ["Container Apps may fit independently deployed or scaled services when a container lifecycle is appropriate."]));
    }
    const recommendation = result("shortlist", null, components, [
      "This workload combines a static frontend with server-side or background components; decide which components deploy and scale independently.",
    ]);
    if (special.some((item) => ["private-ingress", "private-backend", "onprem"].includes(item))) {
      recommendation.uncertainties.push("Validate the inbound and outbound network boundaries for each component separately.");
    }
    return recommendation;
  }

  if (special.includes("os-admin")) {
    const recommendation = result("recommendation", "virtual-machines", [
      candidate("virtual-machines", "strong", [
        "The workload explicitly requires guest-OS, root, or server-level control that managed application platforms do not expose.",
        "Azure Virtual Machines provide control over the guest operating system and server configuration.",
      ], "The team takes responsibility for OS configuration and patching, security hardening, monitoring, availability, and recovery."),
    ], ["Validate whether a supported custom container or managed-host configuration could meet the requirement with less OS administration."]);
    recommendation.hardConstraints = ["Guest-OS or privileged server control is an explicit requirement; managed application hosting is not a like-for-like replacement."];
    return recommendation;
  }

  if (kubernetesNeeds.includes("cluster")) {
    const recommendation = result("recommendation", "aks-standard", [
      candidate("aks-standard", "strong", [
        "The workload explicitly requires cluster-level or node-level Kubernetes configuration.",
        "AKS Standard is the candidate to validate when the required option is not available in the AKS Automatic operating model.",
      ]),
      candidate("aks-automatic", "alternative", [
        "Check the current AKS Automatic feature matrix before accepting the additional cluster configuration and operations of Standard.",
      ]),
    ], ["Verify the exact feature, region, networking, quota, and lifecycle requirements against current AKS support."]);
    recommendation.hardConstraints = ["The workload requires cluster-level or node-level Kubernetes configuration."];
    return recommendation;
  }

  if (kubernetesNeeds.some((need) => ["api", "helm", "operator"].includes(need))) {
    const recommendation = result("recommendation", "aks-automatic", [
      candidate("aks-automatic", "strong", [
        "A required Kubernetes API, Helm integration, or operator makes Kubernetes a workload interface rather than a container packaging preference.",
        "AKS Automatic retains Kubernetes APIs while managing more cluster setup and node operations.",
      ]),
      candidate("aks-standard", "alternative", [
        "Compare AKS Standard if a specific required integration or configuration is outside Automatic's supported model.",
      ]),
    ], ["Confirm that required Kubernetes resources, integrations, and configuration are supported in the target region and AKS operating model."]);
    recommendation.hardConstraints = ["The workload requires Kubernetes APIs or ecosystem tooling that a non-Kubernetes host does not expose."];
    return recommendation;
  }

  if (modelHosted && special.includes("gpu")) {
    const recommendation = moreInformation(input, {
      uncertainties: [
        "The required GPU SKU, region, quota, framework/runtime compatibility, memory, throughput, concurrency, and cost envelope.",
        "Whether a managed GPU profile is sufficient or whether Kubernetes APIs or node-level scheduling are also required.",
      ],
      candidates: [
        candidate("container-apps", "possible", [
          "Container Apps has supported serverless and dedicated GPU configurations, subject to hardware, region, quota, and workload limits.",
        ]),
        candidate("aks-automatic", "possible", [
          "AKS Automatic is a documented starting point for many production GPU workloads that require Kubernetes.",
        ]),
        candidate("aks-standard", "possible", [
          "AKS Standard is worth comparing only when GPU placement or another requirement needs additional cluster control.",
        ]),
      ],
    });
    recommendation.hardConstraints = ["The workload explicitly requires GPU compute to host its own model."];
    return recommendation;
  }

  if (special.includes("custom-runtime")) {
    return moreInformation(input, {
      uncertainties: [
        "Identify the unsupported runtime, native dependency, or required server configuration and verify whether a custom container can satisfy it on a managed platform.",
      ],
      candidates: [
        candidate("app-service", "possible", ["App Service can run supported application stacks and custom containers, but the exact runtime and writable paths must be verified."]),
        candidate("container-apps", "possible", ["Container Apps may fit a custom container when its ingress, scaling, and operating model match the application."]),
        candidate("virtual-machines", "possible", ["Consider a VM only if the runtime or dependency truly requires guest-OS control; the team then owns OS administration and patching."]),
      ],
    });
  }

  if ((workloads.includes("kubernetes") || input.existingAssets === "kubernetes")
    && (!kubernetesNeeds.length || kubernetesNeeds.includes("unsure"))) {
    return moreInformation(input, {
      uncertainties: ["Confirm whether Kubernetes APIs, Helm, operators, or cluster-level configuration are required, or whether the existing containers can move to a managed container platform."],
      candidates: [
        candidate("aks-automatic", "possible", ["Preserves the Kubernetes API and ecosystem with more managed cluster operations."]),
        candidate("container-apps", "possible", ["Can run containerized services without exposing Kubernetes APIs when those interfaces are not required."]),
      ],
    });
  }

  if (workloads.includes("kubernetes") && kubernetesNeeds.includes("none")
    && !workloads.some((item) => ["website", "api", "wordpress", "cms"].includes(item))) {
    return result("recommendation", "container-apps", [
      candidate("container-apps", "strong", [
        "The existing Kubernetes workload has no identified dependency on Kubernetes APIs or cluster-specific configuration.",
        "Container Apps can run containerized services without transferring cluster operations to the team.",
      ]),
      candidate("aks-automatic", "alternative", ["Keep AKS in comparison only if migration testing discovers a Kubernetes-specific dependency."]),
    ]);
  }

  if (modelHosted) {
    return moreInformation(input, {
      uncertainties: ["Confirm model runtime, resource requirements, GPU needs, and expected concurrency before selecting a model-hosting platform."],
      candidates: [
        candidate("container-apps", "possible", ["A managed container platform may fit when its supported compute profile and model runtime meet the workload requirements."]),
        candidate("aks-automatic", "possible", ["Consider Kubernetes only when the model workload needs its APIs or ecosystem."]),
      ],
    });
  }

  const scheduledOnly = workloads.length === 1 && workloads[0] === "scheduled";
  const eventWork = workloads.includes("event") || workloads.includes("worker") || execution.includes("queue") || execution.includes("events");
  if (scheduledOnly || workloads.includes("event") && !workloads.some((item) => ["website", "api", "wordpress", "cms"].includes(item))) {
    if (containerized) {
      return result("recommendation", "container-apps", [
        candidate("container-apps", "strong", ["The workload already uses a container or container deployment model and can be evaluated as a managed job or service."]),
        candidate("functions", "alternative", ["Azure Functions is worth comparing if the code fits a supported trigger and function execution model."]),
      ]);
    }
    return result("recommendation", "functions", [
      candidate("functions", "strong", ["The workload is scheduled or event-triggered code that can run to completion.", "Azure Functions provides triggers and hosting plans designed for discrete execution."]),
      candidate("container-apps", "alternative", ["Compare Container Apps Jobs if the task needs a custom container runtime or job lifecycle."]),
    ]);
  }

  if (workloads.includes("multi") || workloads.includes("worker") && execution.includes("queue")) {
    return result("recommendation", "container-apps", [
      candidate("container-apps", "strong", [
        "The workload includes independently managed components or a queue-driven worker.",
        "Container Apps supports managed container revisions, jobs, ingress, and event-driven scaling without requiring direct Kubernetes operations.",
      ]),
      candidate("app-service", "alternative", ["App Service can still suit a conventional web-facing component; compare component boundaries and scaling separately."]),
      ...(eventWork && !containerized ? [candidate("functions", "possible", ["Functions may be simpler for discrete event handlers that fit a supported trigger model."])] : []),
    ]);
  }

  const webWorkload = workloads.some((item) => ["website", "api", "wordpress", "cms", "ai-app"].includes(item));
  if (webWorkload) {
    const app = candidate("app-service", "strong", [
      workloads.includes("wordpress")
        ? "WordPress is a PHP web application; App Service is a compute candidate when its supported PHP runtime, file paths, extensions, and networking fit."
        : "The workload includes a conventional web application or API that can use a managed web platform.",
      "No Kubernetes API, cluster customization, or mandatory guest-OS control has been identified.",
    ], workloads.includes("wordpress")
      ? "Validate PHP version/extensions, plugin behavior, durable uploads and writable paths, and database compatibility before migration."
      : "");
    const alternatives = [
      candidate("container-apps", "alternative", [
        "Container Apps is worth comparing when the design already uses containers, needs independently scaled components, or has event-driven workers.",
      ]),
    ];
    if (input.stage === "migrate" && input.existingAssets === "vm") {
      alternatives.push(candidate("virtual-machines", "possible", [
        "A VM may be worth comparing if migration testing confirms OS-level dependencies; moving from a VM alone is not a reason to keep the VM operating model.",
      ], "The team would own guest-OS administration, patching, security, monitoring, and availability."));
    }
    const recommendation = result("recommendation", "app-service", [app, ...alternatives]);
    if (special.includes("private-ingress") || special.includes("private-backend") || special.includes("onprem")) {
      recommendation.uncertainties.push("Validate the required inbound/outbound network path, private DNS, and service-plan or environment support.");
    }
    if (special.includes("persistent-files")) {
      recommendation.uncertainties.push("Map application write paths and shared file behavior to supported durable storage before selecting the hosting configuration.");
    }
    return recommendation;
  }

  return moreInformation(input, {
    uncertainties: ["Clarify the runtime and execution pattern before distinguishing web hosting, functions, containers, and other compute options."],
  });
}

export function recommend(input = {}) {
  return addReviewNotes(input, recommendInternal(input));
}

export function formatAssessmentSummary(input, recommendation) {
  if (Array.isArray(input.workloads)) {
    const labels = {
      stage: { new: "New application", migrate: "Migration", modernize: "Modernization", exploring: "Exploration" },
      workloads: Object.fromEntries([
        ["website", "Website"], ["api", "API"], ["wordpress", "WordPress"], ["cms", "CMS"],
        ["worker", "Background worker"], ["scheduled", "Scheduled task"], ["event", "Event function"],
        ["multi", "Multiple components"], ["ai-app", "App calling a managed AI endpoint"],
        ["model", "Self-hosted model"], ["kubernetes", "Existing Kubernetes workload"],
        ["static", "Static frontend"], ["other", "Other workload"], ["unsure", "Not sure"],
      ]),
      technology: Object.fromEntries([
        ["dotnet", ".NET"], ["php", "PHP"], ["python", "Python"], ["node", "Node.js"],
        ["java", "Java"], ["container", "Container image"], ["other", "Other runtime"], ["unsure", "Not sure"],
      ]),
      database: { yes: "Yes", no: "No", unsure: "Not sure" },
      databaseEngine: { "sql-server": "SQL Server / Azure SQL", mysql: "MySQL", mariadb: "MariaDB", postgresql: "PostgreSQL", mongodb: "MongoDB-compatible", other: "Other", unsure: "Not sure" },
      databaseLocation: { onprem: "On-premises", "other-cloud": "Other cloud", azure: "Azure", "move-to-azure": "Planning Azure migration", undecided: "Undecided", unsure: "Not sure" },
      existingAssets: { vm: "Virtual machine or shared host", container: "Containers", kubernetes: "Kubernetes", managed: "Managed application platform", other: "Other", unsure: "Not sure" },
      execution: { http: "HTTP requests", queue: "Queue or messages", schedule: "Scheduled execution", events: "Event triggers", continuous: "Continuous process", unsure: "Not sure" },
      demand: { steady: "Mostly steady", variable: "Variable or bursty", "event-driven": "Event-driven", "short-lived": "Short-lived tasks", unsure: "Not sure" },
      kubernetesNeeds: { api: "Kubernetes API or manifests", helm: "Helm charts", operator: "Operator or custom resource", cluster: "Cluster configuration", none: "No Kubernetes-specific dependency", unsure: "Not sure" },
      special: { "os-admin": "Guest OS or server-level control", "custom-runtime": "Unsupported runtime/native dependency", "private-ingress": "Private-only inbound access", "private-backend": "Private backend access", onprem: "On-premises connectivity", "persistent-files": "Durable/shared application files", gpu: "GPU for a self-hosted model", none: "No additional requirement", unsure: "Not sure" },
      connectionScaling: { yes: "Potential connection pressure", no: "No known connection pressure", unsure: "Connection behavior not known" },
      priorities: { "low-ops": "Less infrastructure to operate", cost: "Cost visibility and efficiency", scale: "Scaling flexibility", control: "Platform or OS control", team: "Team skills and operations", compatibility: "Application compatibility", availability: "Availability and recovery", unsure: "No priority chosen" },
    };
    const selected = ["stage", "workloads", "technology", "existingAssets", "database", "databaseEngine", "databaseLocation", "execution", "demand", "kubernetesNeeds", "special", "connectionScaling", "priorities"]
      .filter((key) => Array.isArray(input[key]) ? input[key].length : input[key])
      .map((key) => {
        const values = Array.isArray(input[key]) ? input[key] : [input[key]];
        const value = values.map((item) => labels[key]?.[item] ?? item).join(", ");
        const titles = {
          workloads: "Workloads", technology: "Technology", existingAssets: "Current deployment",
          databaseEngine: "Database engine", databaseLocation: "Database location", demand: "Demand",
          kubernetesNeeds: "Kubernetes dependencies", special: "Special requirements",
          connectionScaling: "Database connection behavior", priorities: "Team priorities",
        };
        const title = titles[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
        return `${title}: ${value}`;
      });
    if (input.workloads.includes("wordpress") && !(input.technology ?? []).includes("php")) {
      selected.push("Runtime: PHP (implied by WordPress)");
    }
    const outcome = recommendation.primary
      ? `Starting point: ${serviceById[recommendation.primary].name}`
      : `Outcome: ${recommendation.status === "more-info" ? "More information needed" : "Shortlist; validate requirements"}`;
    const candidates = recommendation.candidates.map((item) => `- ${item.service.name}`).join("\n");
    const considerations = recommendation.considerations.map((item) => `- ${item}`).join("\n");
    return [
      "Azure Compute Navigator assessment",
      ...selected,
      outcome,
      candidates ? `Options to review:\n${candidates}` : "",
      recommendation.hardConstraints?.length ? `Hard constraints:\n${recommendation.hardConstraints.map((item) => `- ${item}`).join("\n")}` : "",
      recommendation.preferences?.length ? `Team priorities:\n${recommendation.preferences.map((item) => `- ${item}`).join("\n")}` : "",
      considerations ? `Dependency and architecture checks:\n${considerations}` : "",
      "This is educational architectural guidance, not a production design approval.",
    ].filter(Boolean).join("\n");
  }
  const answers = [
    ["workload", "Workload", input.workload],
    ["deployment", "Deployment", input.deployment],
    ["kubernetes", "Kubernetes", input.kubernetes],
    ["scaling", "Scaling", input.scaling],
    ["gpu", "GPU", input.gpu],
    ["networking", "Networking", input.networking],
    ["operations", "Operations", input.operations],
  ];
  const selected = answers
    .filter(([, , value]) => !isUnknown(value))
    .map(([key, label, value]) => `${label}: ${answerLabels[key]?.[value] ?? value}`);
  const outcome = recommendation.primary
    ? `Starting point: ${serviceById[recommendation.primary].name}`
    : `Outcome: ${recommendation.status === "more-info" ? "More information needed" : "Shortlist; validate requirements"}`;
  const candidates = recommendation.candidates.map((item) => `- ${item.service.name}`).join("\n");
  return [
    "Azure Compute Navigator assessment",
    ...selected,
    outcome,
    candidates ? `Options to review:\n${candidates}` : "",
    "This is educational architectural guidance, not a production design approval.",
  ]
    .filter(Boolean)
    .join("\n");
}

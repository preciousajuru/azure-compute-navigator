import { projectConfig } from "./data/config.js";
import { services, serviceById } from "./data/services.js";
import {
  clearHiddenAnswers,
  createInitialAnswers,
  formatAnswer,
  getVisibleQuestions,
} from "./data/questions.js";
import { formatAssessmentSummary, recommend } from "./logic/recommendations.js";

const explorerServices = services.filter((service) => service.id !== "virtual-machines");
let questions = getVisibleQuestions(createInitialAnswers());

const pathDetails = {
  all: {
    name: "All architecture paths",
    text: "A useful first question is whether you need a web platform, event execution, a managed container platform, or Kubernetes APIs.",
    services: null,
  },
  web: {
    name: "Web app or API",
    branches: { "static-web-apps": "Static frontend", "app-service": "Code or custom container", "container-apps": "Container lifecycle and scaling" },
    text: "A web application can run on a managed web platform even when packaged as a container. Compare App Service and Container Apps when scale behavior or service boundaries matter.",
    services: ["static-web-apps", "app-service", "container-apps"],
  },
  events: {
    name: "Workers and events",
    branches: { functions: "Discrete code execution", "container-apps": "Container worker or job" },
    text: "A discrete event handler or scheduled task may fit Azure Functions. A containerized worker, multi-service workflow, or event-scaled job may fit Container Apps.",
    services: ["functions", "container-apps"],
  },
  kubernetes: {
    name: "Kubernetes requirements",
    branches: { "aks-automatic": "Managed cluster defaults", "aks-standard": "Advanced cluster configuration" },
    text: "Choose AKS when Kubernetes APIs or ecosystem compatibility are requirements. Then compare Automatic's more managed operating model with Standard's broader configuration choices.",
    services: ["aks-automatic", "aks-standard"],
  },
  model: {
    name: "AI and model hosting",
    branches: { "app-service": "Application calls a model API", "container-apps": "Containerized app or model", "aks-automatic": "Kubernetes with managed defaults", "aks-standard": "Custom cluster requirements" },
    text: "First distinguish an app calling a managed model endpoint from a workload that hosts the model. GPU hosting has multiple options and must be checked against hardware, region, quota, and runtime needs.",
    services: ["app-service", "container-apps", "aks-automatic", "aks-standard"],
  },
};

const answers = createInitialAnswers();
let currentStep = 0;
let furthestStep = 0;
let activePath = "web";
let selectedService = "app-service";

const servicePresentation = {
  "static-web-apps": { icon: "static", deployment: "Static assets", api: "No", ownership: "Frontend and API" },
  "app-service": { icon: "web", deployment: "Code / containers", api: "No", ownership: "Application and plan" },
  "container-apps": { icon: "container", deployment: "Containers / jobs", api: "No", ownership: "Apps and environment" },
  functions: { icon: "functions", deployment: "Function runtime", api: "No", ownership: "Functions and triggers" },
  "aks-automatic": { icon: "kubernetes", deployment: "Kubernetes workloads", api: "Yes", ownership: "Workloads and policies" },
  "aks-standard": { icon: "kubernetes", deployment: "Kubernetes workloads", api: "Yes", ownership: "Workloads and cluster" },
  "virtual-machines": { icon: "vm", deployment: "Guest operating system", api: "No", ownership: "OS, security, availability" },
};

const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;

const elements = {
  tabs: [...document.querySelectorAll(".mode-tab")],
  panels: [...document.querySelectorAll(".mode-panel")],
  serviceGrid: document.getElementById("service-grid"),
  diagram: document.getElementById("architecture-map"),
  connections: document.getElementById("map-connections"),
  serviceDetail: document.getElementById("service-detail"),
  serviceContext: document.getElementById("service-context"),
  comparison: document.getElementById("service-comparison"),
  pathExplanation: document.getElementById("path-explanation"),
  pathButtons: [...document.querySelectorAll(".path-card")],
  wizard: document.getElementById("wizard"),
  results: document.getElementById("assessment-results"),
  form: document.getElementById("assessment-form"),
  questionTitle: document.getElementById("question-title"),
  questionHelp: document.getElementById("question-help"),
  questionOptions: document.getElementById("question-options"),
  stepCount: document.getElementById("step-count"),
  stepTopic: document.getElementById("step-topic"),
  progressTrack: document.querySelector(".progress-track"),
  progressFill: document.getElementById("progress-fill"),
  stepNav: document.getElementById("step-nav"),
  answerSummary: document.getElementById("answer-summary"),
  previous: document.getElementById("previous-step"),
  next: document.getElementById("next-step"),
  resultStatus: document.getElementById("result-status"),
  resultContent: document.getElementById("result-content"),
  copyStatus: document.getElementById("copy-status"),
  articleLink: document.getElementById("article-link"),
  repositoryLink: document.getElementById("repository-link"),
  author: document.getElementById("author-attribution"),
  reviewDate: document.getElementById("review-date"),
};

const candidateFitLabel = {
  strong: "Strong fit",
  alternative: "Alternative",
  possible: "Possible path",
};

const statusLabel = {
  recommendation: "Supported starting point",
  shortlist: "Shortlist to compare",
  "more-info": "Needs more information",
};

function setMode(mode, moveFocus = false) {
  for (const tab of elements.tabs) {
    const selected = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  for (const panel of elements.panels) {
    panel.hidden = panel.id !== mode;
  }
  if (moveFocus) {
    document.getElementById(`tab-${mode}`).focus();
  }
  if (window.location.hash !== `#${mode}`) {
    window.history.replaceState(null, "", `#${mode}`);
  }
  if (mode === "explorer") requestAnimationFrame(drawConnections);
}

function renderServiceCards() {
  elements.serviceGrid.innerHTML = explorerServices
    .map((service) => `
      <button class="service-node" type="button" data-service="${service.id}" data-tone="${service.tone}" aria-pressed="false" aria-controls="service-detail">
        <span class="service-icon">${icon(servicePresentation[service.id].icon)}</span>
        <span class="service-node-copy"><strong>${service.shortName}</strong><small>${service.eyebrow}</small></span>
        <span class="node-indicator" aria-hidden="true">‹</span>
      </button>`)
    .join("");
  elements.comparison.innerHTML = `
    <table>
      <caption class="visually-hidden">Azure service deployment models and operational responsibilities. Review the service brief for plan-specific constraints.</caption>
      <thead><tr><th scope="col">Service</th><th scope="col">Deployment model</th><th scope="col">Your team manages</th></tr></thead>
      <tbody>${explorerServices.map((service) => {
        const presentation = servicePresentation[service.id];
        return `<tr><th scope="row"><button type="button" data-inspect="${service.id}">${service.shortName}</button></th><td>${presentation.deployment}</td><td>${presentation.ownership}</td></tr>`;
      }).join("")}</tbody>
    </table>`;
}

function serviceLinks(service) {
  return `<div class="service-links">
    <a href="${service.docs}" target="_blank" rel="noopener noreferrer">Microsoft Learn ${icon("external")}</a>
    <a href="${projectConfig.articleUrl}#${service.articleSection}">Article context ${icon("arrow")}</a>
  </div>`;
}

function renderServiceDetail() {
  const service = serviceById[selectedService];
  const presentation = servicePresentation[selectedService];
  elements.serviceDetail.innerHTML = `
    <div data-tone="${service.tone}">
      <div class="service-detail-heading">
        <span class="service-icon">${icon(presentation.icon)}</span>
        <div><span class="service-code">${service.eyebrow}</span><h2 id="service-detail-title" tabindex="-1">${service.name}</h2></div>
      </div>
      <p class="service-detail-summary">${service.summary}</p>
      <dl class="service-facts">
        <div><dt>Deployment model</dt><dd>${presentation.deployment}</dd></div>
        <div><dt>Direct Kubernetes API</dt><dd>${presentation.api}</dd></div>
      </dl>
      <dl class="service-details">
        <div><dt>Use it when</dt><dd>${service.bestFor}</dd></div>
        <div><dt>Platform capabilities</dt><dd>${service.gains}</dd></div>
        <div><dt>Your responsibilities</dt><dd>${service.operations}</dd></div>
      </dl>
      <details class="service-constraints"><summary>Constraints to validate</summary><p>${service.tradeoffs}</p></details>
      ${serviceLinks(service)}
      <button class="button button-primary assess-service" type="button" data-prefill="${service.id}">Assess this service ${icon("arrow")}</button>
      <p class="prefill-note">Pre-fills a starting workload. Review each answer against your actual requirements.</p>
    </div>`;
}

function updateServiceStates() {
  const connected = pathDetails[activePath].services;
  for (const button of elements.serviceGrid.querySelectorAll("[data-service]")) {
    const selected = button.dataset.service === selectedService;
    const onPath = !connected || connected.includes(button.dataset.service);
    button.classList.toggle("is-selected", selected);
    button.classList.toggle("is-connected", onPath);
    button.setAttribute("aria-pressed", String(selected));
    const branch = pathDetails[activePath].branches?.[button.dataset.service];
    button.setAttribute("aria-label", `${serviceById[button.dataset.service].name}${onPath ? `; included in ${pathDetails[activePath].name}` : ""}${branch ? `; ${branch}` : ""}`);
  }
  requestAnimationFrame(drawConnections);
}

function drawConnections() {
  const bounds = elements.diagram.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  elements.connections.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
  const paths = activePath === "all" ? Object.keys(pathDetails).filter((path) => path !== "all") : [activePath];
  const edges = [];
  for (const path of paths) {
    const source = elements.diagram.querySelector(`[data-path="${path}"]`).getBoundingClientRect();
    for (const id of pathDetails[path].services) {
      const target = elements.serviceGrid.querySelector(`[data-service="${id}"]`).getBoundingClientRect();
      const x1 = source.right - bounds.left;
      const y1 = source.top + source.height / 2 - bounds.top;
      const x2 = target.left - bounds.left;
      const y2 = target.top + target.height / 2 - bounds.top;
      const bend = (x2 - x1) * .5;
      const selected = id === selectedService;
      const label = activePath !== "all" && x2 - x1 > 230 ? pathDetails[path].branches[id] : "";
      edges.push({
        selected,
        markup: `<path class="map-edge${activePath !== "all" ? " is-active" : ""}${selected ? " is-selected" : ""}" d="M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}"/>${selected ? `<circle class="map-endpoint" cx="${x2}" cy="${y2}" r="2.5"/>` : ""}`,
        label: label ? `<text class="edge-label${selected ? " is-selected" : ""}" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2}">${label}</text>` : "",
      });
    }
  }
  edges.sort((a, b) => Number(a.selected) - Number(b.selected));
  elements.connections.innerHTML = edges.map((edge) => edge.markup).join("") + edges.map((edge) => edge.label).join("");
}

function scrollToElement(element) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
}

function selectPath(path) {
  if (!pathDetails[path]) return;
  activePath = path;
  const connected = pathDetails[path].services;
  if (connected && !connected.includes(selectedService)) selectedService = connected[0];
  for (const button of elements.pathButtons) {
    const selected = button.dataset.path === path;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  document.getElementById("path-name").textContent = pathDetails[path].name;
  document.getElementById("path-count").textContent = `${connected?.length ?? explorerServices.length} of ${explorerServices.length}`;
  elements.pathExplanation.textContent = pathDetails[path].text;
  updateServiceStates();
  renderServiceDetail();
  document.getElementById("explorer-status").textContent = `${pathDetails[path].name}: ${connected?.length ?? explorerServices.length} services to investigate. Showing ${serviceById[selectedService].name}.`;
}

function selectService(serviceId) {
  const connected = pathDetails[activePath].services;
  if (connected && !connected.includes(serviceId)) {
    const path = Object.keys(pathDetails).find((key) => pathDetails[key].services?.includes(serviceId));
    selectPath(path);
  }
  selectedService = serviceId;
  updateServiceStates();
  renderServiceDetail();
  document.getElementById("explorer-status").textContent = `Showing the service brief for ${serviceById[serviceId].name}.`;
  if (window.matchMedia("(max-width: 900px)").matches) {
    scrollToElement(elements.serviceContext);
    document.getElementById("service-detail-title").focus({ preventScroll: true });
  }
}

function renderAnswerSummary() {
  const completed = questions.filter(hasAnswer).length;
  document.getElementById("answered-count").textContent = `${completed} / ${questions.length}`;
  elements.answerSummary.innerHTML = questions.map((question, index) => {
    const value = formatAnswer(question, answers[question.key]);
    const active = !elements.wizard.hidden && currentStep === index;
    const available = Boolean(value) || index <= furthestStep;
    return `<button type="button" class="answer-row${value ? " is-complete" : ""}" data-step="${index}"${active ? ' aria-current="step"' : ""}${available ? "" : " disabled"} aria-label="Review ${question.topic}: ${value || "Not answered"}">
      <span class="answer-index" aria-hidden="true">${value ? "✓" : index + 1}</span>
      <span><span class="answer-topic">${question.topic}</span><span class="answer-value">${value || "Not answered"}</span></span>
    </button>`;
  }).join("");
}

function hasAnswer(question) {
  const value = answers[question.key];
  return question.multiple ? Array.isArray(value) && value.length > 0 : Boolean(value);
}

function renderProgress() {
  furthestStep = Math.max(furthestStep, currentStep);
  const question = questions[currentStep];
  const percent = ((currentStep + 1) / questions.length) * 100;
  elements.stepCount.textContent = `Step ${currentStep + 1} of ${questions.length}`;
  elements.stepTopic.textContent = question.topic;
  elements.progressTrack.setAttribute("aria-valuemax", String(questions.length));
  elements.progressTrack.setAttribute("aria-valuenow", String(currentStep + 1));
  elements.progressFill.style.width = `${percent}%`;
  elements.previous.disabled = currentStep === 0;
  elements.next.disabled = !hasAnswer(question);
  elements.next.innerHTML =
    currentStep === questions.length - 1
      ? 'See your guidance <span aria-hidden="true">→</span>'
      : 'Continue <span aria-hidden="true">→</span>';
  elements.stepNav.innerHTML = questions
    .map((step, index) => {
      const active = index === currentStep;
      const completed = hasAnswer(step);
      return `<button type="button" data-step="${index}" aria-label="Go to step ${index + 1}: ${step.topic}" title="${step.topic}"${active ? ' aria-current="step"' : ""}${index > furthestStep && !completed ? " disabled" : ""}${completed ? ' class="is-complete"' : ""}>${index + 1}</button>`;
    })
    .join("");
  renderAnswerSummary();
}

function renderQuestion() {
  const question = questions[currentStep];
  elements.questionTitle.textContent = question.title;
  elements.questionHelp.textContent = question.help;
  elements.questionOptions.innerHTML = question.options
    .map(({ value, label, description }) => `
        <label class="option">
          <input type="${question.multiple ? "checkbox" : "radio"}" name="${question.key}" value="${value}"${question.multiple ? (answers[question.key] ?? []).includes(value) ? " checked" : "" : answers[question.key] === value ? " checked" : ""}>
          <span class="option-copy"><strong>${label}</strong><small>${description}</small></span>
        </label>`)
    .join("");
  renderProgress();
  document.getElementById("assessment-status").textContent = `Step ${currentStep + 1} of ${questions.length}: ${question.topic}.`;
}

function resultDetails(service, tradeoff = "") {
  return `<details class="result-details">
    <summary>Capabilities, responsibilities &amp; limits</summary>
    <dl class="service-details">
      <div><dt>What the service enables</dt><dd>${service.gains}</dd></div>
      <div><dt>What your team still owns</dt><dd>${service.operations}</dd></div>
      <div><dt>Limitations to check</dt><dd>${service.tradeoffs}</dd></div>
      ${tradeoff ? `<div><dt>Trade-off</dt><dd>${tradeoff}</dd></div>` : ""}
    </dl>
    ${serviceLinks(service)}
  </details>`;
}

function renderCandidate(item) {
  const fitClass = item.fit === "alternative" ? "fit-alternative" : item.fit === "possible" ? "fit-possible" : "";
  const reasons = item.reasons.map((reason) => `<li>${reason}</li>`).join("");
  return `
    <article class="candidate-card">
      <div class="candidate-top">
        <h3>${item.service.name}</h3>
        <span class="fit-label ${fitClass}">${candidateFitLabel[item.fit] ?? "Option to assess"}</span>
      </div>
      <p>${item.service.summary}</p>
      <ul>${reasons}</ul>
      ${resultDetails(item.service, item.tradeoff)}
    </article>`;
}

function renderResults(recommendation) {
  const primary = recommendation.primary ? serviceById[recommendation.primary] : null;
  const primaryCandidate = recommendation.candidates.find((item) => item.service.id === recommendation.primary);
  const alternatives = recommendation.candidates.filter((item) => item.service.id !== recommendation.primary);
  document.getElementById("results-title").textContent = primary
    ? "A starting point, with the reasoning"
    : recommendation.status === "shortlist"
      ? "Compare the viable paths"
      : "Clarify the requirements before choosing";
  elements.resultStatus.className = `status-badge${recommendation.status === "shortlist" ? " status-shortlist" : ""}${recommendation.status === "more-info" ? " status-more-info" : ""}`;
  elements.resultStatus.textContent = statusLabel[recommendation.status] ?? "Assessment";

  const primaryHtml = primary
    ? `
      <div class="primary-result" data-tone="${primary.tone}">
        <span class="result-kicker">Starting point</span>
        <div class="result-service-heading"><span class="service-icon">${icon(servicePresentation[primary.id].icon)}</span><h3>${primary.name}</h3></div>
        <p>${primary.summary}</p>
        <ul>${(primaryCandidate?.reasons ?? []).map((reason) => `<li>${reason}</li>`).join("")}</ul>
        ${resultDetails(primary, primaryCandidate?.tradeoff)}
      </div>`
    : `<p class="results-lede">The answers do not support one defensible primary recommendation yet. Compare the candidate paths and resolve the questions below before choosing.</p>`;
  const candidateHtml = alternatives.length
    ? `<div class="candidate-grid">${alternatives.map(renderCandidate).join("")}</div>`
    : "";
  const uncertainHtml = recommendation.uncertainties.length
    ? `<div class="uncertainty-box"><h3>What still needs checking</h3><ul>${recommendation.uncertainties.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
    : "";
  const constraintsHtml = recommendation.hardConstraints?.length
    ? `<div class="constraint-box"><h3>Hard constraint identified</h3><ul>${recommendation.hardConstraints.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
    : "";
  const preferencesHtml = recommendation.preferences?.length
    ? `<div class="preference-box"><h3>Team priorities to preserve</h3><ul>${recommendation.preferences.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
    : "";
  const considerationsHtml = recommendation.considerations?.length
    ? `<section class="consideration-box"><h3>Application and database considerations</h3><ul>${recommendation.considerations.map((item) => `<li>${item}</li>`).join("")}</ul></section>`
    : "";
  const conflictsHtml = recommendation.conflicts.length
    ? `<div class="conflict-box"><h3>Requirements that need clarification</h3><ul>${recommendation.conflicts.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
    : "";
  const candidateList = alternatives.length
    ? `<h3 class="candidate-heading">${primary ? "Other options worth comparing" : "Candidate paths to investigate"}</h3>${primary ? candidateHtml : `<div class="candidate-grid">${recommendation.candidates.map(renderCandidate).join("")}</div>`}`
    : "";

  elements.resultContent.innerHTML = `
    ${primaryHtml}
    ${constraintsHtml}
    ${preferencesHtml}
    ${conflictsHtml}
    ${uncertainHtml}
    ${considerationsHtml}
    ${candidateList}`;
  elements.copyStatus.textContent = "";
  elements.wizard.hidden = true;
  elements.results.hidden = false;
  renderAnswerSummary();
  document.getElementById("assessment-status").textContent = `${statusLabel[recommendation.status]}.${primary ? ` Starting point: ${primary.name}.` : ""}`;
}

function showQuestion() {
  elements.results.hidden = true;
  elements.wizard.hidden = false;
  renderQuestion();
}

function completeAssessment() {
  const unansweredStep = questions.findIndex((question) => !hasAnswer(question));
  if (unansweredStep >= 0) {
    currentStep = unansweredStep;
    showQuestion();
    return;
  }
  const recommendation = recommend(answers);
  renderResults(recommendation);
  scrollToElement(elements.results);
  document.getElementById("results-title").focus({ preventScroll: true });
}

function startOver() {
  Object.assign(answers, createInitialAnswers());
  questions = getVisibleQuestions(answers);
  currentStep = 0;
  furthestStep = 0;
  showQuestion();
  elements.questionTitle.focus();
}

function prefillFromService(serviceId) {
  const presets = {
    "static-web-apps": { stage: "new", workloads: ["static"] },
    "app-service": { stage: "new", workloads: ["api"] },
    "container-apps": { stage: "new", workloads: ["multi"], technology: ["container"], execution: ["http", "queue"] },
    functions: { stage: "new", workloads: ["scheduled"], execution: ["schedule"], demand: "short-lived" },
    "aks-automatic": { stage: "new", workloads: ["kubernetes"], kubernetesNeeds: ["api"] },
    "aks-standard": { stage: "new", workloads: ["kubernetes"], kubernetesNeeds: ["cluster"] },
  };
  setMode("assessment");
  startOver();
  Object.assign(answers, presets[serviceId] ?? {});
  questions = getVisibleQuestions(answers);
  clearHiddenAnswers(answers, questions);
  currentStep = 0;
  furthestStep = 0;
  showQuestion();
  scrollToElement(document.getElementById("assessment"));
}

async function copySummary() {
  const recommendation = recommend(answers);
  const summary = formatAssessmentSummary(answers, recommendation);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
    } else {
      const temporary = document.createElement("textarea");
      temporary.value = summary;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      const copied = document.execCommand("copy");
      temporary.remove();
      if (!copied) throw new Error("Clipboard access is unavailable in this browser.");
    }
    elements.copyStatus.textContent = "Summary copied. It contains only the selected categories and guidance.";
  } catch (error) {
    elements.copyStatus.textContent = "Could not copy automatically. You can review your answers and copy them manually.";
    console.error("Unable to copy the assessment summary.", error);
  }
}

function configureProjectLinks() {
  elements.articleLink.href = projectConfig.articleUrl || "./article/choosing-azure-compute.html";
  if (projectConfig.repositoryUrl) {
    elements.repositoryLink.href = projectConfig.repositoryUrl;
    elements.repositoryLink.target = "_blank";
    elements.repositoryLink.rel = "noopener noreferrer";
    elements.repositoryLink.hidden = false;
  }
  if (projectConfig.authorName) {
    elements.author.textContent = `Created by ${projectConfig.authorName}`;
    elements.author.hidden = false;
  }
  if (projectConfig.technicalReviewDate) {
    elements.reviewDate.dateTime = projectConfig.technicalReviewDate;
    const date = new Date(`${projectConfig.technicalReviewDate}T00:00:00Z`);
    elements.reviewDate.textContent = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = elements.tabs.indexOf(tab);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? elements.tabs.length - 1
      : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + elements.tabs.length) % elements.tabs.length;
    setMode(elements.tabs[nextIndex].dataset.mode, true);
  });
});

elements.pathButtons.forEach((button) => button.addEventListener("click", () => selectPath(button.dataset.path)));

elements.serviceGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-service]");
  if (button) selectService(button.dataset.service);
});
elements.comparison.addEventListener("click", (event) => {
  const button = event.target.closest("[data-inspect]");
  if (button) selectService(button.dataset.inspect);
});
elements.serviceDetail.addEventListener("click", (event) => {
  const button = event.target.closest("[data-prefill]");
  if (button) prefillFromService(button.dataset.prefill);
});
document.getElementById("back-to-map").addEventListener("click", () => {
  const selectedNode = elements.serviceGrid.querySelector(`[data-service="${selectedService}"]`);
  scrollToElement(elements.diagram);
  selectedNode.focus({ preventScroll: true });
});
document.getElementById("wizard-back-to-explorer").addEventListener("click", () => setMode("explorer", true));
document.getElementById("wizard-restart").addEventListener("click", startOver);
document.getElementById("restart-results").addEventListener("click", startOver);
document.getElementById("edit-answers").addEventListener("click", () => {
  currentStep = 0;
  showQuestion();
  document.querySelector(`#question-options input[name="${questions[0].key}"]`)?.focus();
});
document.getElementById("copy-summary").addEventListener("click", copySummary);
elements.previous.addEventListener("click", () => {
  if (currentStep === 0) return;
  currentStep -= 1;
  renderQuestion();
  document.querySelector(`#question-options input[name="${questions[currentStep].key}"]`)?.focus();
});
elements.next.addEventListener("click", () => {
  if (!hasAnswer(questions[currentStep])) return;
  if (currentStep === questions.length - 1) {
    completeAssessment();
    return;
  }
  currentStep += 1;
  renderQuestion();
  elements.questionTitle.focus?.();
});
elements.questionOptions.addEventListener("change", (event) => {
  const activeQuestion = questions[currentStep];
  if (event.target.name !== activeQuestion.key) return;
  const activeKey = activeQuestion.key;
  if (activeQuestion.multiple) {
    const exclusives = ["none", "unsure"];
    const selected = new Set(answers[activeKey]);
    if (event.target.checked) {
      if (exclusives.includes(event.target.value)) selected.clear();
      else exclusives.forEach((value) => selected.delete(value));
      selected.add(event.target.value);
    } else {
      selected.delete(event.target.value);
    }
    answers[activeKey] = [...selected];
  } else {
    answers[activeKey] = event.target.value;
  }
  const previousKeys = questions.map(({ key }) => key);
  questions = getVisibleQuestions(answers);
  clearHiddenAnswers(answers, questions);
  const updatedKeys = questions.map(({ key }) => key);
  const activeIndex = questions.findIndex(({ key }) => key === activeKey);
  currentStep = activeIndex >= 0 ? activeIndex : Math.min(currentStep, questions.length - 1);
  furthestStep = Math.min(furthestStep, questions.length - 1);
  if (previousKeys.join("|") !== updatedKeys.join("|")) {
    renderQuestion();
    elements.questionOptions.querySelector(`input[name="${CSS.escape(activeKey)}"][value="${CSS.escape(event.target.value)}"]`)?.focus();
  } else {
    renderProgress();
  }
});
function navigateToStep(event) {
  const button = event.target.closest("[data-step]");
  if (!button || button.disabled) return;
  currentStep = Number(button.dataset.step);
  showQuestion();
  elements.questionTitle.focus();
}
elements.stepNav.addEventListener("click", navigateToStep);
elements.answerSummary.addEventListener("click", navigateToStep);
elements.form.addEventListener("submit", (event) => event.preventDefault());
window.addEventListener("hashchange", () => {
  if (["#explorer", "#assessment"].includes(window.location.hash)) {
    setMode(window.location.hash.slice(1));
  }
});

configureProjectLinks();
renderServiceCards();
selectPath(activePath);
renderQuestion();
new ResizeObserver(() => requestAnimationFrame(drawConnections)).observe(elements.diagram);
setMode(window.location.hash === "#explorer" ? "explorer" : "assessment");

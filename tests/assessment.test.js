import test from "node:test";
import assert from "node:assert/strict";
import {
  clearHiddenAnswers,
  createInitialAnswers,
  getVisibleQuestions,
} from "../src/data/questions.js";

const keysFor = (answers) => getVisibleQuestions(answers).map(({ key }) => key);

test("the assessment begins with project lifecycle and application purpose", () => {
  assert.deepEqual(keysFor(createInitialAnswers()), ["stage", "workloads"]);
});

test("a static-only workload skips runtime, database, and application execution questions", () => {
  const keys = keysFor({ stage: "new", workloads: ["static"] });
  assert.deepEqual(keys, ["stage", "workloads", "special", "priorities"]);
});

test("an unknown workload does not expose unrelated technical requirement questions", () => {
  const keys = keysFor({ stage: "exploring", workloads: ["unsure"] });
  assert.deepEqual(keys, ["stage", "workloads"]);
});

test("an API with a database and variable demand gets compatibility and connection questions", () => {
  const keys = keysFor({
    stage: "new",
    workloads: ["api"],
    database: "yes",
    demand: "variable",
  });
  for (const key of ["technology", "database", "databaseEngine", "databaseLocation", "execution", "demand", "special", "connectionScaling", "priorities"]) {
    assert.ok(keys.includes(key), `Expected ${key} in the visible flow`);
  }
  assert.ok(!keys.includes("existingAssets"));
  assert.ok(!keys.includes("kubernetesNeeds"));
});

test("an existing WordPress migration shows deployment and database dependencies but infers PHP", () => {
  const keys = keysFor({
    stage: "migrate",
    workloads: ["wordpress"],
    database: "yes",
  });
  assert.ok(keys.includes("existingAssets"));
  assert.ok(keys.includes("databaseEngine"));
  assert.ok(keys.includes("databaseLocation"));
  assert.ok(!keys.includes("technology"));
  assert.ok(!keys.includes("kubernetesNeeds"));
});

test("an existing Kubernetes workload asks about Kubernetes interfaces", () => {
  const keys = keysFor({ stage: "modernize", workloads: ["kubernetes"] });
  assert.ok(keys.includes("existingAssets"));
  assert.ok(keys.includes("kubernetesNeeds"));
  assert.ok(!keys.includes("database"));
});

test("answers to questions hidden by an earlier change are cleared while active answers remain", () => {
  const answers = {
    stage: "new",
    workloads: ["static"],
    database: "yes",
    databaseEngine: "mariadb",
    databaseLocation: "onprem",
    priorities: ["team"],
  };
  const visible = getVisibleQuestions(answers);
  clearHiddenAnswers(answers, visible);
  assert.deepEqual(answers.workloads, ["static"]);
  assert.equal(answers.database, "");
  assert.equal(answers.databaseEngine, "");
  assert.equal(answers.databaseLocation, "");
  assert.deepEqual(answers.priorities, ["team"]);
});

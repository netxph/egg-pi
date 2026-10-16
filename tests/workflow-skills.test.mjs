import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const read = (name) => readFileSync(join(cwd, "skills", name, "SKILL.md"), "utf8");
const plan = read("plan"), build = read("build"), code = read("code"), vet = read("vet");

test("all workflow skills are discoverable explicit-invocation skills", async () => {
	assert(process.env.PI_PACKAGE_DIR, "Set PI_PACKAGE_DIR to the installed @earendil-works/pi-coding-agent directory");
	const { loadSkills } = await import(pathToFileURL(join(process.env.PI_PACKAGE_DIR, "dist/core/skills.js")));
	const names = ["build", "capture", "code", "delta", "design", "plan", "recover", "slice", "sync", "vet"];
	const result = loadSkills({ cwd, skillPaths: names.map((name) => `./skills/${name}`), includeDefaults: false });
	assert.deepEqual(result.diagnostics, []);
	assert.deepEqual(result.skills.map((skill) => skill.name).sort(), names);
	for (const text of names.map(read)) {
		assert(text.includes("disable-model-invocation: true"));
		assert.equal((text.match(/^```/gm) ?? []).length % 2, 0);
	}
});

test("capture, slice, design, and plan use only todo completion, including branch recovery", () => {
	for (const name of ["capture", "slice", "design", "plan"]) {
		const text = read(name);
		for (const phrase of ["## Implementation-state authority", "Only that todo establishes implementation progress", "If no matching todo or task exists", "checkbox is unchecked", "recovering documents from an already implemented branch", "entry points", "Build still reconciles real source/run state", "replay mutations"])
			assert(text.includes(phrase), `${name}: ${phrase}`);
	}
	assert(plan.includes("Without matching todo completion, recovered tasks start unchecked"));
	assert(plan.includes("retain its actual checkpoint and completion evidence"));
	assert(plan.includes("Implementation-State Source"));
});

test("recover composes all document stages and confirms evidence-backed todo recovery in chat", () => {
	const recover = read("recover");
	for (const name of ["capture", "slice", "design", "plan"]) {
		assert(recover.includes(`../${name}/SKILL.md`));
		assert(read(name).includes("/skill:recover"));
		assert(read(name).includes("/skill:sync"));
	}
	for (const phrase of ["All output stays in chat", "Do not save or modify any files", "Before changing any checkbox", "Unavailable evidence stays pending", "confirm specific task IDs", "Recovered completion — confirmed now", "Historical RED is not recoverable from current GREEN alone", "No files saved; no implementation performed"])
		assert(recover.includes(phrase), phrase);
	assert(read("slice").includes("accept its clearly identified session intent directly"));
});

test("delta revises an existing slice through capture, design, and plan without re-slicing", () => {
	const delta = read("delta");
	for (const name of ["capture", "design", "plan"]) {
		assert(delta.includes(`../${name}/SKILL.md`));
		assert(read(name).includes("/skill:delta"), `${name} accepts delta`);
	}
	for (const phrase of ["change description", "one focused question at a time", "exact revised spec", "Plan approval is separate", "confirmed destinations", "Do not invoke build/code", "Preserve stable IDs", "New tasks start unchecked", "active workers", "superseded", "complete revised", "No files saved; no implementation performed"])
		assert(delta.includes(phrase), phrase);
	assert(delta.indexOf("1. **Capture") < delta.indexOf("2. **Design"));
	assert(delta.indexOf("2. **Design") < delta.indexOf("3. **Plan"));
	assert(!delta.includes("../slice/SKILL.md"));
	assert(!read("slice").includes("/skill:delta"));
	for (const phrase of ["existing target slice", "Do not invoke the slice skill", "retain its template, type, ID", "upstream coordination"])
		assert(delta.includes(phrase), phrase);
});

test("delta accepts a requested change and target feature via folder, prompt, or current session", () => {
	const delta = read("delta");
	for (const phrase of ["## Required inputs", "two inputs", "Requested change", "Target feature", "intent, design/spec, plan, and todo", "Folder:", "Prompt:", "Current session:", "no rigid argument syntax", "do not require saved files", "If either input is missing or ambiguous", "do not silently choose the newest or mix conflicting versions"])
		assert(delta.includes(phrase), phrase);
});

test("delta checks whole-set coverage and preserves progress without inventing completion", () => {
	const delta = read("delta");
	for (const phrase of ["## Whole-set synchronization gate", "both directions", "unaffected", "parent_intent", "source_intent", "reference_spec", "requirements/scenarios", "dependencies", "checkboxes", "historical RED", "not proven synchronized", "Re-read", "Never silently reset", "todo remains the progress authority"])
		assert(delta.includes(phrase), phrase);
});

test("sync reports discrepancies before approved document resolution and never implements code", () => {
	const sync = read("sync");
	assert(sync.indexOf("## Mandatory report-first boundary") < sync.indexOf("## Approved resolution"));
	for (const phrase of ["folder containing the documents", "merge-base --all", "multiple best ancestors", "staged, unstaged, and relevant untracked changes", "first substantive result is a discrepancy report", "Stop and wait for explicit approval", "complete revised affected documents in chat", "Code fixes are **follow-up only**", "Modify document files only when explicitly requested", "Unavailable evidence stays pending"])
		assert(sync.includes(phrase), phrase);
});

test("sync compares content without document-approval gates but retains resolution consent", () => {
	const sync = read("sync");
	for (const phrase of ["## Content-only comparison", "Do not check approval status", "Do not report missing approvals or different status labels as discrepancies", "Task checkboxes and their claimed implementation/test results remain substantive content", "resolution consent is separate from document approval status", "do not require a separate spec/plan approval-status transition", "content-alignment verdict, not document approval or build readiness"])
		assert(sync.includes(phrase), phrase);
	assert(sync.includes("Stop and wait for explicit approval before revising documents or checkboxes"));
	assert(!sync.includes("approval/version mismatches"));
	assert(!sync.includes("a spec/plan contract revision requires renewed approval"));
});

test("sync's Git examples resolve merge-base and include committed plus local/untracked scope", () => {
	const repo = mkdtempSync(join(tmpdir(), "egg-pi sync "));
	const git = (...args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-C", repo, ...args], { encoding: "utf8" });
	const commit = (message) => git("-c", "user.name=Skill Test", "-c", "user.email=skill-test@example.invalid", "-c", "commit.gpgsign=false", "commit", "--no-verify", "-qm", message);
	try {
		git("init", "-q", "-b", "main");
		writeFileSync(join(repo, "tracked.txt"), "base\n");
		git("add", "tracked.txt");
		commit("base");
		const base = git("rev-parse", "HEAD").trim();
		git("checkout", "-qb", "feature");
		writeFileSync(join(repo, "branch.txt"), "branch change\n");
		git("add", "branch.txt");
		commit("feature");
		writeFileSync(join(repo, "branch.txt"), "staged change\n");
		git("add", "branch.txt");
		writeFileSync(join(repo, "tracked.txt"), "unstaged change\n");
		writeFileSync(join(repo, "untracked.txt"), "local only\n");
		const scripts = [...read("sync").matchAll(/```bash\n([\s\S]*?)\n```/g)].map((match) => match[1]);
		const result = execFileSync("bash", ["-e", "-c", scripts[0] + '\nmerge_base="$(git -C "$repo" merge-base "$base_commit" "$head_commit")"\n' + scripts[1]], { encoding: "utf8", env: { ...process.env, repo, base_ref: "main" } });
		assert(result.startsWith(base + "\n"));
		for (const evidence of ["branch.txt", "staged change", "tracked.txt", "unstaged change", "untracked.txt"]) assert(result.includes(evidence), evidence);
	} finally {
		rmSync(repo, { recursive: true, force: true });
	}
});

test("build accepts file, pasted, and session plans with linked spec and intent context", () => {
	for (const phrase of ["file, pasted in the invocation", "session history", "frontmatter first", "relative to the containing document", "plan's directory", "source intent", "approval", "three implementation", "RED", "GREEN"])
		assert(build.includes(phrase), phrase);
	assert(!build.includes("May I run `/skill:vet` first"));
	assert(!build.includes("vet may not have reviewed"));
});

test("plan returns separate linked plan/todo documents in chat and saves only on request", () => {
	for (const phrase of ['todo: "./todo.md"', 'plan: "./plan.md"', "two separate documents", "## Execution Checkpoint", "Review Rounds Used", "stable task IDs", "Record evidence", "restart does not reset the cap", "Save only on explicit request", "saving either document is not an execution prerequisite"])
		assert(plan.includes(phrase), phrase);
	assert(plan.includes("Return") && plan.includes("in chat"));
	assert(!plan.includes("both documents are saved"));
});

test("build updates a file or session todo and reconciles recovery without duplicate work", () => {
	for (const phrase of ["separate todo document is required", "available as a file or in the current session", "Do not require saving either document before execution", "File-backed", "Session-backed", "complete updated todo document in a Markdown code block", "only when the user explicitly asks", "versions disagree, ask", "On **every start or resume**", "authoritative progress ledger", "completed mutations", "restart does not mean a child stopped", "non-idempotent operations", "sole writer of checklist progress", "stop new launches", "not three per task or session", "Session-only progress is not guaranteed to survive a new session"])
		assert(build.includes(phrase), phrase);
	assert(!build.includes("separate saved `todo.md` is required"));
	assert(!build.includes("save both `plan.md` and `todo.md`"));
});

test("code always delegates fresh leaf workers, including tiny work, without recursive delegation", () => {
	for (const phrase of ["even a one-line", "no parent-implementation shortcut", 'context: "fresh"', "leaf implementer", "do not invoke `/skill:code` again", "or spawn children", "A follow-up repair gets a new fresh worker"])
		assert(code.includes(phrase), phrase);
	for (const text of [build, code]) {
		assert(text.includes("one writer per cwd/worktree"));
		assert(text.includes("native completion"));
	}
});

test("vet reviews document compliance and actual gate evidence alongside the full diff", () => {
	for (const phrase of ["## Document alignment", "## Plan and test-gate evidence", "staged, unstaged, and untracked", "historical RED", "integrated GREEN", "unavailable required review lane", "content digests", "snapshot", "Standalone branch review"])
		assert(vet.includes(phrase), phrase);
	assert(!vet.includes("workflowScript:"));
});

test("vet's workflow example executes with five distinct fresh-context read-only review lanes", async () => {
	const script = vet.match(/```js workflow\n([\s\S]*?)\n```/)[1];
	const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
	let jobs;
	const result = await new AsyncFunction("runs", script)({
		all: async (items) => {
			jobs = items;
			return items.map((item) => ({ output: item.key, outputReference: item.output, artifactPaths: [] }));
		},
	});
	assert.equal(result.length, 5);
	assert.equal(new Set(jobs.map((job) => job.key)).size, 5);
	assert.equal(new Set(jobs.map((job) => job.output)).size, 5);
	for (const job of jobs) {
		assert.equal(job.context, "fresh");
		assert.equal(job.agent, "reviewer");
		assert(job.label && job.cwd);
		assert(job.task.includes("Do not modify project/source files or launch children"));
	}
});

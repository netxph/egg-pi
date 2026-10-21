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

test("capture, design, and plan interview for compatibility and record all five categories", () => {
	for (const name of ["capture", "design", "plan"]) {
		const text = read(name);
		const template = text.match(/```markdown\n([\s\S]*?)\n```/)[1];
		for (const phrase of ["## Backwards compatibility", "ask_user_question", "Reuse confirmed upstream answers", "Not applicable", "unknown"])
			assert(text.includes(phrase), `${name}: ${phrase}`);
		assert(template.includes("### Backwards Compatibility"), name);
		for (const category of ["API", "Data schema", "Cache", "Deployment manifests", "Default behaviour"])
			assert(template.includes(`| ${category} |`), `${name}: ${category}`);
	}
});

test("compatibility decisions stay at the right document stage and remain traceable to vet", () => {
	const capture = read("capture"), design = read("design");
	for (const phrase of ["plain-language impact", "not approval of a technical breaking change", "Do not ask for endpoint", "Uncertainties & Open Questions"])
		assert(capture.includes(phrase), phrase);
	const captureTemplate = capture.match(/```markdown\n([\s\S]*?)\n```/)[1];
	assert.equal((captureTemplate.match(/^## \d\./gm) ?? []).length, 8);
	assert(captureTemplate.indexOf("### Backwards Compatibility") > captureTemplate.indexOf("## 6. Constraints & Boundaries"));
	assert(captureTemplate.indexOf("### Backwards Compatibility") < captureTemplate.indexOf("## 7. Non-Goals"));
	for (const phrase of ["Preserve|Intentional break|Not applicable|Unknown", "explicit user confirmation", "R-", "AC-", "exact approved specification", "does not bypass the intent synchronization gate"])
		assert(design.includes(phrase), phrase);
	for (const phrase of ["do not authorize a new breaking change", "revise and reapprove the spec", "migration", "invalidation", "rollout", "rollback", "compatibility tasks and checks", "Do not run migrations", "**Compatibility**:"])
		assert(plan.includes(phrase), phrase);
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

test("every code worker bootstraps lc with active-task guidance without broadening its role", () => {
	const lc = readFileSync(join(cwd, "prompts", "lc.md"), "utf8");
	assert(lc.includes("# Local coding workflow"));
	assert(lc.includes("${@:-"), "lc has a session-only default that task guidance must replace");
	for (const phrase of ["## Worker startup: apply `/lc` first", "../../prompts/lc.md", "installed skill directory, not the target repository", "acceptance authors, implementers, integration-only workers, and repair workers", "absolute template path", "non-empty task-specific guidance", "Before task discovery or edits", "replaces the template's session-only default", "do not wait for another user turn", "not a shell command or a callable tool", "do not assume slash text in a child task is expanded", "No extra child/session", "does not widen the assigned role", "stop before editing", "lc bootstrap + complete role-focused brief"])
		assert(code.includes(phrase), phrase);
});

test("build pipelines acceptance authorship without bypassing slice RED or upstream specifications", () => {
	for (const phrase of ["capture → slice → design", "Do not repeat specification interviews", "Role-focused handoffs", "acceptance-test author", "implementation of slice A", "acceptance tests for slice B", "test-authoring readiness", "implementation readiness", "behavioral RED", "assertion identity"])
		assert(build.includes(phrase), phrase);
	assert(build.includes("code owns all implementation worker launches"));
});

test("code separates acceptance authors from implementers and preserves independent assertions", () => {
	for (const phrase of ["## Focused worker roles", "**Acceptance-test author**", "**Implementer**", "same `worker` profile", "Do not read private implementation", "public entry point", "production code is read-only", "acceptance tests and their fixtures are read-only", "internal unit tests", "initial outside RED", "fresh acceptance-test author", "additional agreed scenarios", "not historical RED", "Do not add a separate unit-test author"])
		assert(code.includes(phrase), phrase);
	assert(code.indexOf("## Focused worker roles") < code.indexOf("## Implementation principles"));
});

test("workers and reviewers receive focused evidence rather than the entire orchestration history", () => {
	for (const text of [build, code, vet]) {
		assert(text.includes("role-focused"));
		assert(text.includes("session-only"));
		assert(text.includes("original"));
	}
	assert(code.includes("Do not pass the entire orchestration packet"));
	assert(vet.includes("Do not require every reviewer to read every document"));
	assert(!vet.includes("each a distinct lane brief and the complete shared context packet"));
	assert(vet.includes("correctness and test-completion lanes"));
});

test("vet checks independent acceptance assertions against specifications and the integrated result", () => {
	for (const phrase of ["not the acceptance-test author or implementer session", "not an unquestionable oracle", "private collaborators", "assertion identity", "additional scenarios", "not historical RED", "correctness and test-completion lanes"])
		assert(vet.includes(phrase), phrase);
});

test("vet reviews document compliance and actual gate evidence alongside the full diff", () => {
	for (const phrase of ["## Document alignment", "## Plan and test-gate evidence", "staged, unstaged, and untracked", "historical RED", "integrated GREEN", "unavailable required review lane", "content digests", "snapshot", "Standalone branch review"])
		assert(vet.includes(phrase), phrase);
	assert(!vet.includes("workflowScript:"));
});

test("vet includes attributable build warnings and defers non-Critical security work without downgrading severity", () => {
	for (const phrase of ["Capture build warnings even when the build succeeds", "attributable to touched source files", "exclude unrelated pre-existing warnings", "command, exit status, diagnostic", "deduplicate warnings", "isolated validation environment", "report the build check unavailable", "Security follow-ups (separate work items, lower priority)", "retaining severity, evidence, impact", "do not block the verdict or trigger current build repair rounds", "including when rated High", "Critical security findings stay in the blocking Critical section", "independent non-security defects retain normal gates", "do not create tickets"])
		assert(vet.includes(phrase), phrase);
	assert(build.includes("Vet's non-Critical security-only follow-ups stay lower-priority separate work items, not current repair-round tasks"));
	assert(!vet.includes("`High` always requires human review"));
});

test("vet labels compatibility categories, impact severity, and specification-backed exceptions", () => {
	for (const phrase of ["## Backwards compatibility", "**API**", "**Data schema**", "**Cache**", "**Deployment manifests**", "**Default behaviour**", "old and new versions", "Compatibility: API|Data schema|Cache|Deployment manifests|Default behaviour", "Disposition: Unplanned break|Spec-approved change|Unclear", "Unadjusted severity:", "Spec evidence:", "Severity: Info", "exact approved specification version and requirement", "not a required fix", "do not trigger build repair rounds", "A vague mention", "does not waive failed checks", "## Compatibility changes (spec-approved, non-blocking)", "All six review lanes"])
		assert(vet.includes(phrase), phrase);
	assert(!vet.includes("All five review lanes"));
});

test("vet's workflow example executes with six distinct fresh-context read-only review lanes", async () => {
	const script = vet.match(/```js workflow\n([\s\S]*?)\n```/)[1];
	const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
	let jobs;
	const result = await new AsyncFunction("runs", script)({
		all: async (items) => {
			jobs = items;
			return items.map((item) => ({ output: item.key, outputReference: item.output, artifactPaths: [] }));
		},
	});
	assert.equal(result.length, 6);
	assert.equal(new Set(jobs.map((job) => job.key)).size, 6);
	assert.equal(new Set(jobs.map((job) => job.output)).size, 6);
	const byKey = Object.fromEntries(jobs.map((job) => [job.key, job.task]));
	assert(byKey.correctness.includes("original intent/spec/plan/checklist"));
	assert(byKey.tests.includes("assertion identities/revisions"));
	assert(byKey.tests.includes("initial RED, additional scenarios, integrated GREEN"));
	assert(!byKey.lint.includes("original intent/spec/plan/checklist"));
	assert(!byKey.maintainability.includes("author/implementer handoffs"));
	for (const phrase of ["API", "Data schema", "Cache", "Deployment manifests", "Default behaviour", "approved specification", "Unadjusted severity", "Spec-approved change"])
		assert(byKey.compatibility?.includes(phrase), phrase);
	for (const job of jobs) {
		assert.equal(job.context, "fresh");
		assert.equal(job.agent, "reviewer");
		assert(job.label && job.cwd);
		assert(job.task.includes("Do not modify project/source files or launch children"));
	}
});

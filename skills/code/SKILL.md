---
name: code
description: Implement every coding task through fresh-context pi-subagents workers, using language-idiomatic code and outside-in TDD. Use when explicitly invoked as /skill:code or as the implementation stage of an explicitly requested /skill:build.
disable-model-invocation: true
---

# Coding

Implement the requested change, not speculative adjacent work. Ask the user when a requirement or tradeoff cannot be resolved from the task, existing code, tests, or project conventions; otherwise make the smallest complete change.

## Plan-driven context

When called by build or given plan-driven work, the coordinating parent follows the context-resolution contract in `../build/SKILL.md` without executing build. Read the exact plan/checklist, related design/spec, and source intent from references, the document directory, or identified session context. Consume the approved upstream specifications rather than repeating their interviews. Ask with `ask_user_question` if execution exposes missing or conflicting context, versions, approval, or relationships. Stop on intent/spec/plan drift; do not silently reinterpret the contract. Project requirements/scenarios, entry points, constraints/non-goals, dependencies, and existing test-gate evidence into role-focused worker briefs; leaf workers do not independently resolve the whole document chain.

A standalone coding request does not require creating a plan/spec/intent document. Use the explicit task and confirmed context, and ask about missing behavior or trade-offs rather than inventing them.

## Before editing

1. Inspect applicable `AGENTS.md` files from the repository and its parent directories, including more specific nested files for directories being changed. Also inspect relevant contributor documentation such as `CONTRIBUTING.md`, `DEVELOPING.md`, and project-specific guidance.
2. Check whether `.editorconfig` exists at the repository root or in applicable parent directories. If present, follow it for every edited file. If absent, follow the repository's existing formatting and tooling conventions.
3. Treat user instructions and applicable repository rules from `AGENTS.md`, `.editorconfig`, and related contributor documentation as higher priority than this skill. Resolve conflicts in that order rather than silently choosing this skill's defaults.
4. Surface only documentation and files relevant to the assigned role. Implementers study connected callers, tests, APIs, error handling, naming, and neighboring implementations; acceptance authors inspect public contracts and test setup, not private implementation.
5. Identify the language and use its idiomatic standard-library patterns, formatting, testing style, error model, and ecosystem conventions. Prefer maintainability over speculative performance optimization.
6. Use the approved API or observable contract: inputs, outputs, errors, compatibility, and side effects. For standalone work, establish it from the explicit task and confirmed context first. Preserve existing behavior unless the task explicitly changes it.
7. Identify any breaking change—API, behavior, data, configuration, compatibility, or workflow—before writing code. Warn the user clearly and wait for confirmation before implementing it, unless the user explicitly requested that breaking change.

## Mandatory fresh-context delegation

**Every implementation task, even a one-line or otherwise tiny change, must run through pi-subagents in a fresh child session.** There is no parent-implementation shortcut. The parent may inspect, clarify, schedule, and validate; all product/test/documentation edits, integration/conflict fixes, and review repairs go through workers. One bounded child is sufficient for a tiny task; do not add extra stages merely for ceremony.

Read the installed pi-subagents skill and relevant execution/isolation guidance before launching; discover the available `worker` profile. If the tool/profile is unavailable or launch/runtime/tooling fails, stop and report the blocker and partial run/worktree state. Never silently edit directly, switch to another CLI, or change models as a fallback.

- Use `context: "fresh"` explicitly for every implementation child. Do not fork parent history or resume an old worker as a substitute. A follow-up repair gets a new fresh worker with the prior handoff and current evidence.
- Give each child a self-contained, role-focused brief: assigned role and goal; exact repo/cwd/ref and source state; task/slice IDs; relevant plan/spec/intent content or accessible exact versioned references; requirements/scenarios; feature entry point; constraints; prerequisites and evidence; exclusive edit boundary; validation commands; expected report; and stop/ask conditions. Include relevant session-only context as content, not an inaccessible conversation pointer. Do not pass the entire orchestration packet or other workers' reasoning. Read applicable original contract sections and connected evidence; follow references when needed, not unrelated history.
- The child is a **leaf implementer** with one focused assignment (acceptance-test author, implementer, or integration-only worker): execute only that role's assigned work under this skill's implementation/testing rules; do not invoke `/skill:code` again, load the parent delegation procedure as a new commission, or spawn children. Route unresolved decisions through `contact_supervisor` when available; the parent interviews the user instead of guessing.
- For build, honor its ready-frontier assignment and report task evidence; do not independently reschedule the rest of the plan or edit its authoritative checklist. For standalone multi-task work, classify single-seam vs multi-seam and assign exclusive boundaries before launch.
- Launch asynchronously by default. A single task can use `subagent({ agent: "worker", task: "<lc bootstrap + complete role-focused brief>", cwd: "<repo>", async: true, options: { context: "fresh" } })`. For a coordinated wave, write one `js workflow` block using labeled/keyed `runs.run` / `runs.all` children with `context: "fresh"`, then call `subagent({ workflow: true, async: true })`. Do not use the obsolete `workflowScript` API or competing top-level workflow orchestrators.
- Split only genuinely independent ready tasks. Keep **one writer per cwd/worktree**, including parent writes; different files in the same checkout do not permit parallel writers. Concurrent implementation requires isolated worktrees, non-conflicting contracts/environment, and a serial integration gate. Managed isolation requires a clean source checkout; never auto-commit, stash, or discard work to enable it. Verify prerequisite changes exist in the lane base, or serialize in the existing checkout.
- While workers run, perform only safe independent read-only preparation. If nothing safe remains, yield for native completion rather than polling, sleeping, or using `bg_wait` for ordinary native runs. Do not treat a launch receipt as a completed task.
- The parent owns arbitration and acceptance. Inspect actual diffs and evidence; route integration and accepted fixes to fresh workers, then validate the integrated result. Use returned run/output/artifact references for durable handoffs, not invented report paths. No commit, push, or deployment authority is implied.

## Worker startup: apply `/lc` first

Every coding child starts with the local coding workflow: acceptance authors, implementers, integration-only workers, and repair workers, including tiny tasks. Resolve `../../prompts/lc.md` relative to this installed skill directory, not the target repository. The parent reads it once per run and includes its absolute template path and non-empty task-specific guidance in every direct or workflow child brief. Do not depend on the child's prompt discovery or inherited session state.

Prepend this bootstrap before the role-focused assignment, replacing the path and role placeholders:

```text
Before task discovery or edits, read <absolute path to prompts/lc.md> and apply its body as /lc with this guidance: "Perform the supplied <role> assignment now, with scoped discovery and validation inside its read/write boundaries." This guidance replaces the template's session-only default; do not wait for another user turn. Then execute the assignment below. Its role, authority, outside-in gates, and no-recursion rules remain binding.
```

`/lc` is a prompt template, not a shell command or a callable tool; do not assume slash text in a child task is expanded. Reading and applying its body with the supplied guidance is the startup step. No extra child/session or initialization-only turn is needed. Loading `/lc` does not widen the assigned role, authorize nested delegation or background-script fallbacks, bypass tool refusals, or weaken acceptance-test ownership and RED/GREEN gates. Use only exposed tools; retain this skill's stop-on-infrastructure-failure rule. If the template cannot be read or applied, stop before editing and report the blocker to the parent. Include the loaded template path and applied guidance in the worker handoff.

## Focused worker roles

Use the same `worker` profile with different bounded briefs, not new top-level skills or recursive orchestrators. For a behavioral change, acceptance authorship and production implementation use separate fresh sessions even when isolation constraints require serial execution. Do not add a separate unit-test author: internal tests and production code evolve together under the implementer. A trivial or behavior-preserving task with no required outside gate needs only its bounded implementation worker; retain any required approved gate exception.

- **Acceptance-test author** — derive assertions from approved observable behavior, not implementation choices. Own only assigned acceptance tests and their fixtures; production code is read-only. Use the public entry point (API, CLI, UI, event, or equivalent), existing harness/conventions, and real integration path. Do not read private implementation or the implementer's design/reasoning to choose expected outcomes; inspect only public boundary declarations and test setup as needed. Do not assert private collaborators, call sequences, or internal data structures. Mocks at genuinely external boundaries may follow repository conventions; mocking the feature under test cannot establish acceptance. Deliver requirement/scenario mappings, test/fixture paths, assertion identity (content digest or exact artifact version), runnable command/environment, expected/actual behavioral failure, source state, and run/artifact references. Missing tooling, fixtures, or an undecided public interface is a blocker, not RED; route necessary production/setup changes through a separately bounded prerequisite assignment.
- **Implementer** — receive the applicable contract, accepted outside tests and initial outside RED evidence, connected source, and internal task dependencies. Own production code and internal unit tests; acceptance tests and their fixtures are read-only. Work inward with unit RED/GREEN, then repeatedly run the outside tests for feedback. Do not replace the real acceptance path with mocks, skip assertions, or change expected outcomes to obtain GREEN. Report suspected contract/test defects to the parent with evidence.
- **Integration-only worker** — apply accepted handoffs and resolve mechanical integration conflicts within explicit boundaries. Do not reinterpret behavior or weaken tests. Semantic conflicts return to the parent; acceptance-test corrections go to a fresh acceptance-test author and production fixes to a fresh implementer.

The parent checks acceptance assertions against the approved scenarios before accepting RED. Route test corrections to a fresh acceptance-test author with the exact defect and contract evidence; changing product behavior requires the existing approval/alignment process. Record authorized assertion revisions and rerun affected gates; a revised test does not inherit an earlier test version's RED. Independence of authorship does not make tests an unquestionable oracle.

Acceptance authors can work on independent slices concurrently. After accepted initial outside RED, they may add **additional agreed scenarios** alongside implementation in isolated worktrees, without hiding requirements or changing the agreed public contract. Keep their test versions and evidence separate: an added test's failure observed only after implementation started is not historical RED for the slice. Do not replace the initial RED gate with a final-only acceptance run. Validate every added scenario on the integrated source state.

## Implementation principles

- Prefer readable variable and function names over comments. Add comments only to explain non-obvious rationale, constraints, or unavoidable workarounds.
- Follow the language's way of doing things: idiomatic APIs, types, control flow, error handling, module boundaries, and test conventions.
- Prefer simple, explicit code and existing project helpers. Do not add abstractions, configuration, dependencies, or flexibility without a demonstrated need.
- Apply SOLID principles where they improve the design, but do not force them into small or stable code. Abstract only when a real variation, boundary, or repeated concept requires it.
- Preserve and match existing patterns unless they are directly harmful to the requested change.
- Validate trust boundaries, accessibility, security, and data-loss risks even when optimizing for simplicity.

## Testing: outside-in TDD

Work from the outside inward, then validate outward again:

1. An acceptance-test author writes or updates a public-boundary integration or acceptance test that expresses the user-visible/API behavior and initially fails for the missing behavior. The parent verifies its assertions and behavioral RED evidence before production implementation starts.
2. A separate implementer traces inward and adds the smallest focused unit tests for collaborators or edge cases needed to support that behavior.
3. The implementer writes the minimum production code to make the unit tests and then the outside tests pass. Run outside tests during development, not only at the end.
4. Run the focused tests, then the broader relevant suite, formatter, linter, type checker, and build when available.
5. Integrate accepted test and implementation handoffs serially, then rerun the same initial assertions and any additional agreed scenarios through the real public path plus relevant regressions. Isolated lane GREEN is not integrated acceptance.

For plan-driven work, preserve the exact per-slice outside RED → inward tasks → integrated outside GREEN order and dependency gates. Before implementation, record the outside test's behavioral failure with its command, working directory/environment, scenario, source state, and run/log reference. Broken tooling, syntax, or fixtures are not RED evidence. At completion, rerun the same outside scenarios through the real integration, earlier slice acceptance, and relevant regressions on the integrated source state; collaborator mocks alone cannot prove GREEN.

Tests should prove behavior rather than implementation details. Add the smallest runnable check that catches regressions; do not manufacture test scaffolding or a fake failure for trivial or behavior-preserving work. A plan's required gate may be skipped only with an explicit documented user-approved exception. If RED evidence is missing after implementation, report it honestly rather than claiming it from a passing suite or rewriting history.

## Documentation

Update relevant documentation when the change affects public behavior, APIs, configuration, workflows, setup, examples, or operational guidance. Keep documentation changes in the same change when practical. Do not add documentation for internal implementation details that users do not need to know.

## Completion

Inspect the final diff for accidental changes, dead code, naming clarity, API compatibility, documentation completeness, and adherence to `.editorconfig` and project conventions. Return assigned role, task/slice and requirement/scenario IDs, source state and context versions, worker run IDs and worktree/artifact references, changed files, acceptance assertion identities and authorized revisions, actual RED/GREEN and integration/regression commands/results (initial gate versus additional scenarios), documentation updated, and unresolved assumptions or skipped coverage. Distinguish child-reported evidence from independently rerun verification, and worker completion from integrated acceptance. Do not mark authoritative plan tasks complete yourself when build owns the checklist. Include concise, actionable improvement recommendations discovered during development, clearly separating them from required work and never implementing speculative improvements without approval. Do not claim success for checks that were not run.

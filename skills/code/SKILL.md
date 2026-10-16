---
name: code
description: Implement every coding task through fresh-context pi-subagents workers, using language-idiomatic code and outside-in TDD. Use when explicitly invoked as /skill:code or as the implementation stage of an explicitly requested /skill:build.
disable-model-invocation: true
---

# Coding

Implement the requested change, not speculative adjacent work. Ask the user when a requirement or tradeoff cannot be resolved from the task, existing code, tests, or project conventions; otherwise make the smallest complete change.

## Plan-driven context

When called by build or given plan-driven work, follow the context-resolution contract in `../build/SKILL.md` without executing build. Read the exact plan/checklist, related design/spec, and source intent from references, the document directory, or identified session context. Ask with `ask_user_question` if context, versions, approval, or relationships are missing or ambiguous. Stop on intent/spec/plan drift; do not silently reinterpret the contract. Carry requirements/scenarios, entry points, constraints/non-goals, dependencies, and existing test-gate evidence into each worker brief.

A standalone coding request does not require creating a plan/spec/intent document. Use the explicit task and confirmed context, and ask about missing behavior or trade-offs rather than inventing them.

## Before editing

1. Inspect applicable `AGENTS.md` files from the repository and its parent directories, including more specific nested files for directories being changed. Also inspect relevant contributor documentation such as `CONTRIBUTING.md`, `DEVELOPING.md`, and project-specific guidance.
2. Check whether `.editorconfig` exists at the repository root or in applicable parent directories. If present, follow it for every edited file. If absent, follow the repository's existing formatting and tooling conventions.
3. Treat user instructions and applicable repository rules from `AGENTS.md`, `.editorconfig`, and related contributor documentation as higher priority than this skill. Resolve conflicts in that order rather than silently choosing this skill's defaults.
4. Surface only documentation and files relevant to the task. Study existing callers, tests, APIs, error handling, naming, and neighboring implementations before choosing a design.
5. Identify the language and use its idiomatic standard-library patterns, formatting, testing style, error model, and ecosystem conventions. Prefer maintainability over speculative performance optimization.
6. Define the API or observable contract first: inputs, outputs, errors, compatibility, and side effects. Preserve existing behavior unless the task explicitly changes it.
7. Identify any breaking change—API, behavior, data, configuration, compatibility, or workflow—before writing code. Warn the user clearly and wait for confirmation before implementing it, unless the user explicitly requested that breaking change.

## Mandatory fresh-context delegation

**Every implementation task, even a one-line or otherwise tiny change, must run through pi-subagents in a fresh child session.** There is no parent-implementation shortcut. The parent may inspect, clarify, schedule, and validate; all product/test/documentation edits, integration/conflict fixes, and review repairs go through workers. One bounded child is sufficient for a tiny task; do not add extra stages merely for ceremony.

Read the installed pi-subagents skill and relevant execution/isolation guidance before launching; discover the available `worker` profile. If the tool/profile is unavailable or launch/runtime/tooling fails, stop and report the blocker and partial run/worktree state. Never silently edit directly, switch to another CLI, or change models as a fallback.

- Use `context: "fresh"` explicitly for every implementation child. Do not fork parent history or resume an old worker as a substitute. A follow-up repair gets a new fresh worker with the prior handoff and current evidence.
- Give each child a self-contained brief: goal; exact repo/cwd/ref and source state; task/slice IDs; relevant plan/spec/intent content or accessible exact references; requirements/scenarios; feature entry point; constraints; prerequisites and evidence; exclusive edit boundary; validation commands; expected report; and stop/ask conditions. Session-only context must be included as content, not an inaccessible conversation pointer.
- The child is a **leaf implementer**: execute only the assigned work under this skill's implementation/testing rules; do not invoke `/skill:code` again, load the parent delegation procedure as a new commission, or spawn children. Route unresolved decisions through `contact_supervisor` when available; the parent interviews the user instead of guessing.
- For build, honor its ready-frontier assignment and report task evidence; do not independently reschedule the rest of the plan or edit its authoritative checklist. For standalone multi-task work, classify single-seam vs multi-seam and assign exclusive boundaries before launch.
- Launch asynchronously by default. A single task can use `subagent({ agent: "worker", task: "<complete brief>", cwd: "<repo>", async: true, options: { context: "fresh" } })`. For a coordinated wave, write one `js workflow` block using labeled/keyed `runs.run` / `runs.all` children with `context: "fresh"`, then call `subagent({ workflow: true, async: true })`. Do not use the obsolete `workflowScript` API or competing top-level workflow orchestrators.
- Split only genuinely independent ready tasks. Keep **one writer per cwd/worktree**, including parent writes; different files in the same checkout do not permit parallel writers. Concurrent implementation requires isolated worktrees, non-conflicting contracts/environment, and a serial integration gate. Managed isolation requires a clean source checkout; never auto-commit, stash, or discard work to enable it. Verify prerequisite changes exist in the lane base, or serialize in the existing checkout.
- While workers run, perform only safe independent read-only preparation. If nothing safe remains, yield for native completion rather than polling, sleeping, or using `bg_wait` for ordinary native runs. Do not treat a launch receipt as a completed task.
- The parent owns arbitration and acceptance. Inspect actual diffs and evidence; route integration and accepted fixes to fresh workers, then validate the integrated result. Use returned run/output/artifact references for durable handoffs, not invented report paths. No commit, push, or deployment authority is implied.

## Implementation principles

- Prefer readable variable and function names over comments. Add comments only to explain non-obvious rationale, constraints, or unavoidable workarounds.
- Follow the language's way of doing things: idiomatic APIs, types, control flow, error handling, module boundaries, and test conventions.
- Prefer simple, explicit code and existing project helpers. Do not add abstractions, configuration, dependencies, or flexibility without a demonstrated need.
- Apply SOLID principles where they improve the design, but do not force them into small or stable code. Abstract only when a real variation, boundary, or repeated concept requires it.
- Preserve and match existing patterns unless they are directly harmful to the requested change.
- Validate trust boundaries, accessibility, security, and data-loss risks even when optimizing for simplicity.

## Testing: outside-in TDD

Work from the outside inward, then validate outward again:

1. Write or update an integration or acceptance test that expresses the user-visible/API behavior and initially fails.
2. Trace inward and add the smallest focused unit tests for the collaborators or edge cases needed to support that behavior.
3. Implement the minimum code to make the unit tests pass, then the integration test.
4. Run the focused tests, then the broader relevant suite, formatter, linter, type checker, and build when available.
5. Re-run the integration/API-level tests after unit-level changes to verify the complete behavior and compatibility.

For plan-driven work, preserve the exact per-slice outside RED → inward tasks → integrated outside GREEN order and dependency gates. Before implementation, record the outside test's behavioral failure with its command, working directory/environment, scenario, source state, and run/log reference. Broken tooling, syntax, or fixtures are not RED evidence. At completion, rerun the same outside scenarios through the real integration, earlier slice acceptance, and relevant regressions on the integrated source state; collaborator mocks alone cannot prove GREEN.

Tests should prove behavior rather than implementation details. Add the smallest runnable check that catches regressions; do not manufacture test scaffolding or a fake failure for trivial or behavior-preserving work. A plan's required gate may be skipped only with an explicit documented user-approved exception. If RED evidence is missing after implementation, report it honestly rather than claiming it from a passing suite or rewriting history.

## Documentation

Update relevant documentation when the change affects public behavior, APIs, configuration, workflows, setup, examples, or operational guidance. Keep documentation changes in the same change when practical. Do not add documentation for internal implementation details that users do not need to know.

## Completion

Inspect the final diff for accidental changes, dead code, naming clarity, API compatibility, documentation completeness, and adherence to `.editorconfig` and project conventions. Return task/slice and requirement/scenario IDs, source state and context versions, worker run IDs and worktree/artifact references, changed files, actual RED/GREEN and integration/regression commands/results, documentation updated, and unresolved assumptions or skipped coverage. Distinguish child-reported evidence from independently rerun verification, and worker completion from integrated acceptance. Do not mark authoritative plan tasks complete yourself when build owns the checklist. Include concise, actionable improvement recommendations discovered during development, clearly separating them from required work and never implementing speculative improvements without approval. Do not claim success for checks that were not run.

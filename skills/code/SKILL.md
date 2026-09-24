---
name: code
description: Implement coding tasks with language-idiomatic, maintainable code using API-first design, outside-in TDD, and delegated workers. Use only when the user explicitly invokes /skill:code.
disable-model-invocation: true
---

# Coding

Implement the requested change, not speculative adjacent work. Ask the user when a requirement or tradeoff cannot be resolved from the task, existing code, tests, or project conventions; otherwise make the smallest complete change.

## Before editing

1. Inspect applicable `AGENTS.md` files from the repository and its parent directories, including more specific nested files for directories being changed. Also inspect relevant contributor documentation such as `CONTRIBUTING.md`, `DEVELOPING.md`, and project-specific guidance.
2. Check whether `.editorconfig` exists at the repository root or in applicable parent directories. If present, follow it for every edited file. If absent, follow the repository's existing formatting and tooling conventions.
3. Treat user instructions and applicable repository rules from `AGENTS.md`, `.editorconfig`, and related contributor documentation as higher priority than this skill. Resolve conflicts in that order rather than silently choosing this skill's defaults.
4. Surface only documentation and files relevant to the task. Study existing callers, tests, APIs, error handling, naming, and neighboring implementations before choosing a design.
5. Identify the language and use its idiomatic standard-library patterns, formatting, testing style, error model, and ecosystem conventions. Prefer maintainability over speculative performance optimization.
6. Define the API or observable contract first: inputs, outputs, errors, compatibility, and side effects. Preserve existing behavior unless the task explicitly changes it.
7. Identify any breaking change—API, behavior, data, configuration, compatibility, or workflow—before writing code. Warn the user clearly and wait for confirmation before implementing it, unless the user explicitly requested that breaking change.

## Delegation

Use pi-subagents workers for implementation support. Give each worker a bounded objective, repository context, edit boundary, acceptance criteria, validation command, and expected report.

- Split independent tasks and run them in parallel.
- Keep one writer per file or exclusive seam; avoid concurrent edits to the same files.
- Use workers for focused discovery, test design, implementation seams, or independent validation as appropriate; do not add workers merely for ceremony.
- The parent owns integration, conflict resolution, final decisions, and acceptance. Review worker output and diffs rather than trusting it blindly.
- If delegated mutation would overlap, sequence the work or use isolated worktrees according to pi-subagents guidance.

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

Tests should prove behavior rather than implementation details. Add the smallest runnable check that catches regressions; do not manufacture test scaffolding for trivial changes.

## Documentation

Update relevant documentation when the change affects public behavior, APIs, configuration, workflows, setup, examples, or operational guidance. Keep documentation changes in the same change when practical. Do not add documentation for internal implementation details that users do not need to know.

## Completion

Inspect the final diff for accidental changes, dead code, naming clarity, API compatibility, documentation completeness, and adherence to `.editorconfig` and project conventions. Report files changed, tests and checks run, documentation updated, and any unresolved assumption or skipped coverage. Include concise, actionable improvement recommendations discovered during development, clearly separating them from required work and never implementing speculative improvements without approval. Do not claim success for checks that were not run.

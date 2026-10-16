---
name: vet
description: Review committed and uncommitted changes with fresh parallel specialists, including approved plan/design/intent alignment and outside-in test evidence for plan-driven builds. Use when explicitly invoked as /skill:vet or as the review stage of an explicitly requested /skill:build.
disable-model-invocation: true
---

# Branch review

Run a read-only, evidence-based review of the current branch and current working-tree changes. Do not edit files, fix findings, update task checkboxes, commit, or push. Run checks only when they do not mutate the reviewed checkout or shared state; use an explicitly prepared isolated validation environment when needed, or report the check unavailable. Managed output artifacts are allowed; project/source edits are not.

## Plan-driven review context

When called by build or given a plan, follow the context-resolution contract in `../build/SKILL.md` without executing build. Read the exact plan and checklist, related design/spec, and source intent (including parent intent for an input slice). Resolve frontmatter/body references relative to their documents, then verify same-directory or session candidates; ask with `ask_user_question` when context or relationships are missing or ambiguous. Do not assume fresh reviewers inherit session history: include session-only document content in their briefs.

Require the approved document versions, current task/slice progress, feature entry points, requirement/scenario mapping, worker/integration handoffs, and per-slice RED/GREEN execution evidence or documented user-approved exceptions. Check actual alignment, not just statuses: `intent_sync: "not synced"`, contract drift, or unresolved requirements block build completion. Never rewrite documents to match code or accept a plan as permission to violate intent. Apply document compliance to the plan's changes, not unrelated pre-existing user work; review other included branch changes as diff scope without silently making them build tasks.

Standalone branch review remains valid without a plan: state **Document alignment: Not applicable — standalone diff review, no plan supplied**. Once plan-driven context is expected, missing documents or approval/test-gate evidence are blockers, not grounds to fall back silently to diff-only review. Missing evidence is not proof that an event never happened; describe the exact unavailable evidence and affected task/scenario without inventing a code defect.

## Scope

Resolve the comparison base before delegating:

```bash
base_ref="${1:-}"
if [ -z "$base_ref" ]; then
  for candidate in "$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)" main master; do
    if [ -n "$candidate" ] && git rev-parse --verify "$candidate" >/dev/null 2>&1; then
      base_ref="$candidate"
      break
    fi
  done
fi
[ -n "$base_ref" ] && git rev-parse --verify "$base_ref" >/dev/null || {
  printf 'No valid review base ref found\\n' >&2
  exit 1
}
merge_base="$(git merge-base HEAD "$base_ref")"
git diff --stat "$merge_base"...HEAD
git diff --name-status "$merge_base"...HEAD
git diff --stat HEAD --
git diff --name-status HEAD --
git ls-files --others --exclude-standard
```

If the supplied/default ref is missing, use an existing `main`, `master`, or upstream tracking ref; if no base can be resolved, stop and report that instead of guessing. Review the committed `merge_base...HEAD` changes **and** all current working-tree changes: `git diff HEAD --` includes staged and unstaged tracked edits, while `git ls-files --others --exclude-standard` lists untracked files that must be inspected directly. Include surrounding code needed to verify behavior. Do not report pre-existing issues unless an included change makes them reachable or materially worse. Never stage, discard, or overwrite changes during review.

Include the exact repository/cwd, base ref, merge-base SHA, HEAD, context versions, and full committed/staged/unstaged/untracked scope in every reviewer brief. Freeze product writers during review. Record the tracked diff plus untracked paths/content digests as a review snapshot; `git status --short` alone cannot detect content changes within an already modified file. Before the verdict, compare HEAD, diff, untracked content, and document/evidence versions with that snapshot. If anything relevant changed, invalidate the affected reviews and rerun them on the new snapshot, or report BLOCK with the uncovered changes; never claim the old review covers new work.

## Review fan-out

After resolving scope, read the installed pi-subagents skill and review/execution guidance, then discover the available `reviewer` profile. Launch these independent fresh-context `reviewer` agents in one asynchronous workflow using `runs.all`. Explicitly set `context: "fresh"`, give each a distinct lane brief and the complete shared context packet, and keep checks from contending for mutable environments:

1. **Linting/static checks** — inspect changed files and run the repository's existing lint, formatter, type-check, and static-analysis commands where practical. Report real failures and suspicious changed-code patterns, not formatter preferences.
2. **Code smells/maintainability** — look for unnecessary complexity, duplication, unsafe abstractions, dead code, compatibility hazards, and disproportionate maintenance cost introduced by the branch.
3. **Correctness/behavioral** — trace changed behavior from the design's external feature entry points through callers and state changes; find regressions, edge cases, broken contracts, race/state errors, error-handling gaps, and API behavior changes. For plan-driven work, verify intent → spec → plan → implementation alignment, preserved behavior/non-goals, approvals, and every completed task's actual outcome. Cite the exact document requirement and code evidence for deviations; do not invent extra product requirements.
4. **Test completion** — compare changed behavior with existing unit and integration coverage; run safe focused tests and identify concrete missing cases, weak assertions, or untested failure paths. For each planned vertical slice, verify RED evidence predates implementation and fails for the specified missing behavior, then verify the same outside scenarios pass through the real integrated path at GREEN. Check prerequisite ordering, approved exceptions, coverage IDs, and final integrated regression evidence. Passing final tests alone cannot prove historical RED, and a green isolated lane cannot prove the merged state passes.
5. **Security** — inspect trust boundaries, authentication, authorization, secrets, injection, data exposure, unsafe deserialization, dependency/config changes, and abuse cases. Exercise or assess both unit- and integration-level security tests where relevant.

Each reviewer is read-only and must return concise findings in this format:

```text
Severity: Critical|High|Medium|Low|Info
Title: <one sentence>
Evidence: <file:line and the relevant code path, diff hunk, command output, or reproduction>
Impact: <what can happen>
Fix: <smallest concrete remedy>
Confidence: high|medium|low
```

Require reviewers to distinguish a confirmed defect from a suspicion, cite file paths and line numbers, and state `No findings` when their lane is clean. They should end with `Merge verdict: BLOCK`, `Merge verdict: HUMAN REVIEW`, or `Merge verdict: OK`.

Use the current scripted-workflow interface: write one `js workflow` block in the reply, then call `subagent({ workflow: true, async: true })` in that same reply. Do not use the obsolete `workflowScript` parameter. For example, after replacing the packet and lane briefs with resolved evidence:

```js workflow
const packet = "<repo/cwd/base/merge-base/HEAD/snapshot; complete diff scope; document versions/content; task and test evidence; finding format and read-only rules>";
const lanes = [
  ["lint", "Review lint and static checks", "<lint-specific brief and safe commands>"],
  ["maintainability", "Review maintainability", "<maintainability-specific brief>"],
  ["correctness", "Review behavior and document alignment", "<behavior and intent/spec/plan alignment brief>"],
  ["tests", "Review coverage and outside-in gates", "<coverage, historical RED, integrated GREEN, and dependency evidence brief>"],
  ["security", "Review security boundaries", "<security-specific brief and safe checks>"]
];
const jobs = await runs.all(lanes.map(([key, label, brief]) => ({
  key, label, agent: "reviewer", context: "fresh", cwd: "<resolved repository>",
  task: packet + "\n\n" + brief + "\nDo not modify project/source files or launch children. Return findings and missing evidence.",
  output: "review/" + key + ".md"
})));
return jobs.map(job => ({ output: job.output, outputReference: job.outputReference, artifactPaths: job.artifactPaths }));
```

While reviewers run, do only independent read-only synthesis. When only async lanes remain, yield for native completion; do not poll, sleep, or use `bg_wait` for ordinary native runs. Inspect the aggregate result and its artifact references before concluding.

Do not force a hard tool budget on reviewers. Keep prompts distinct and include the actual diff scope rather than relying on conversation history. On launch/runtime/tooling failure, stop affected orchestration and report the exact failure, run/snapshot/worktree state, and unavailable lanes; do not silently substitute another execution mode or treat a failed lane as clean.

## Consolidation

After all lanes finish, consolidate findings yourself:

- Deduplicate the same root cause reported by multiple lanes.
- Verify each accepted finding against the current branch and diff; discard unsupported speculation and pre-existing unrelated issues.
- Preserve the strongest evidence and list corroborating lanes.
- Separate required fixes from observations and missing-but-low-risk polish.
- Do not change severity to make the result pass.
- Consolidate document alignment and per-slice gate evidence separately from severity findings. Identify missing context, approval, historical RED, integrated GREEN, required checks, and unavailable lanes explicitly. These can block build completion even without a confirmed Critical/High code defect. Cite artifact/command evidence and distinguish child reports from independent verification.

Use these severities exactly:

- **Critical** — data loss, secret exposure, authentication or authorization failure, destructive migration, or severe public API break. Block automated progression and escalate.
- **High** — major correctness regression, exploitable weakness, severe performance regression, or material licensing violation. Require human review.
- **Medium** — important missing tests, moderate regression, compatibility concern, or likely maintainability problem. Route to the responsible reviewer.
- **Low** — minor documentation, style, or localized maintainability issue. Usually non-blocking.
- **Info** — observation with no required action.

A finding's impact wins over the lane that found it: for example, a security reviewer may report a correctness issue, and a test reviewer may uncover a High regression. Reclassify accordingly and explain only when the classification is non-obvious.

## Final report

Return a compact report in this order:

```text
# Branch review
Base: <ref>
Merge-base: <sha>
Compared: <merge-base>...HEAD plus current staged, unstaged, and untracked changes
Snapshot: <HEAD and tracked/untracked content identity; stable or uncovered changes>
Reviewers: <completed>/<total>; unavailable: <lanes or none>

## Document alignment
<plan/spec/intent/checklist references and approvals; aligned, blocked with exact mismatches/missing context, or reason not applicable>

## Plan and test-gate evidence
<task/slice coverage and dependencies; actual RED/GREEN and integrated regression evidence; approved exceptions; missing required evidence>

## Critical
- [lane] title — evidence; impact; fix

## High
...

## Medium
...

## Low
...

## Info
...

## Verdict
BLOCK — Critical findings, missing required plan context/alignment/approval/test-gate evidence, failed required checks, an unstable/uncovered snapshot, or an unavailable required review lane
HUMAN REVIEW — High findings without another BLOCK condition
PASS WITH NOTES — all required gates satisfied; no Critical/High findings; Medium/Low/Info remain
PASS — all required gates satisfied; no actionable findings
```

Only include populated severity sections; always include scope, document alignment, test-gate evidence, reviewer availability, and verdict. All five review lanes are required for a plan-driven build; standalone review must also disclose any unavailable lane and cannot claim complete review. `Critical` always blocks automated progression; `High` always requires human review. Missing required evidence or a failed required check is not a pass, regardless of code finding severity. Mention actual commands/results and failures separately; never turn a failing test into a code finding without explaining the affected behavior. Return the full report to build without modifying code or task progress.

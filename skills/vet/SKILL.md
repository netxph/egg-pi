---
name: vet
description: Review committed and uncommitted changes with fresh parallel specialists, including backwards compatibility, approved plan/design/intent alignment, and outside-in test evidence for plan-driven builds. Use when explicitly invoked as /skill:vet or as the review stage of an explicitly requested /skill:build.
disable-model-invocation: true
---

# Branch review

Run a read-only, evidence-based review of the current branch and current working-tree changes. Do not edit files, fix findings, update task checkboxes, commit, or push. Run checks only when they do not mutate the reviewed checkout or shared state; use an explicitly prepared isolated validation environment when needed, or report the check unavailable. Managed output artifacts are allowed; project/source edits are not.

## Plan-driven review context

When called by build or given a plan, the coordinating parent follows the context-resolution contract in `../build/SKILL.md` without executing build. Read the exact plan and checklist, related design/spec, and source intent (including parent intent for an input slice). Resolve frontmatter/body references relative to their documents, then verify same-directory or session candidates; ask with `ask_user_question` when context or relationships are missing or ambiguous. Consume the approved upstream contract, not a new specification interview. Do not assume fresh reviewers inherit session history: include relevant session-only document content in their role-focused briefs, with exact versioned references to accessible originals.

For build-driven review, retain the parent's active context folder or exact session-only identity, baseline/delta mode, and resolved plan/spec/todo references. Do not select another folder's checklist or import baseline/sibling tasks into completion gates. Review code in the recorded source repository/worktree, not the planning folder. Broader branch diff review remains read-only evidence, not permission to expand the active build's tasks. Include the active context identity in the report and applicable reviewer briefs.

Require the approved document versions, current task/slice progress, feature entry points, requirement/scenario mapping, worker/integration handoffs, and per-slice RED/GREEN execution evidence or documented user-approved exceptions. Check actual alignment, not just statuses: `intent_sync: "not synced"`, contract drift, or unresolved requirements block build completion. Never rewrite documents to match code or accept a plan as permission to violate intent. Apply document compliance to the plan's changes, not unrelated pre-existing user work; review other included branch changes as diff scope without silently making them build tasks.

For a spec with `source_delta`, include the resolved delta, `baseline_intent`, and explicitly included prior changes in applicable reviewer briefs. Check **effective intent: baseline plus explicitly included prior changes plus the delta**; an explicitly specified delta change is not a violation merely because it differs from baseline intent. Baseline delivery is assumed completed for delta scoping, not historical verification. Require gate evidence for the change's tasks and affected regressions, not historical baseline tasks; do not import baseline checkboxes or waive actual source/prerequisite contradictions. The change spec and plan still require their own approvals. Keep the baseline and previous packages immutable.

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

After resolving scope, read the installed pi-subagents skill and review/execution guidance, then discover the available `reviewer` profile. Launch these independent fresh-context `reviewer` agents in one asynchronous workflow using `runs.all`. Explicitly set `context: "fresh"` and use role-focused handoffs: shared repository/base/HEAD/snapshot identity, full diff-scope references, finding format, and read-only rules; then distinct lane-specific files, constraints, commands, document sections, and evidence references. Do not require every reviewer to read every document or copy the entire build history into every brief. The correctness and test-completion lanes read the applicable original intent/spec/plan/checklist sections and gate evidence; other lanes receive relevant requirements and connected references. All lanes may follow connected evidence or report missing context rather than guess. Keep checks from contending for mutable environments:

1. **Linting/static checks** — inspect changed files and run the repository's existing lint, formatter, type-check, static-analysis, and build commands where practical. Capture build warnings even when the build succeeds, and report those attributable to touched source files; exclude unrelated pre-existing warnings. Cite the command, exit status, diagnostic, and source file:line where available, and deduplicate warnings repeated by lint/type-check/build. Builds must obey the read-only rule: use an explicitly prepared isolated validation environment for generated outputs, or report the build check unavailable. Report real failures, relevant warnings, and suspicious changed-code patterns, not formatter preferences.
2. **Code smells/maintainability** — look for unnecessary complexity, duplication, unsafe abstractions, dead code, compatibility hazards, and disproportionate maintenance cost introduced by the branch.
3. **Correctness/behavioral** — trace changed behavior from the design's external feature entry points through callers and state changes; find regressions, edge cases, broken contracts, race/state errors, error-handling gaps, and API behavior changes. For plan-driven work, verify intent → spec → plan → implementation alignment, preserved behavior/non-goals, approvals, and every completed task's actual outcome. Cite the exact document requirement and code evidence for deviations; do not invent extra product requirements.
4. **Test completion** — use a fresh independent reviewer, not the acceptance-test author or implementer session. Compare changed behavior with existing unit and integration coverage; run safe focused tests and identify concrete missing cases, weak assertions, or untested failure paths. Independently map acceptance assertions to the approved contract: tests are not an unquestionable oracle. Check for expectations derived from private collaborators instead of public behavior, mocks bypassing the real feature path, weakened/skipped assertions, and unauthorized test/fixture changes by implementers. For each planned vertical slice, verify initial RED evidence predates implementation and fails for the specified missing behavior; compare assertion identity and authorized revisions with the initial gate. Verify the same outside scenarios and additional scenarios pass through the real integrated path at GREEN. Additional tests first run after implementation started are not historical RED; do not reject legitimate supplemental coverage merely for being authored later, or let it replace the required initial gate. Check prerequisite ordering, author/implementer handoffs, approved exceptions, coverage IDs, and final integrated regression evidence. Passing final tests alone cannot prove historical RED, and a green isolated lane cannot prove the merged state passes.
5. **Security** — inspect trust boundaries, authentication, authorization, secrets, injection, data exposure, unsafe deserialization, dependency/config changes, and abuse cases. Exercise or assess both unit- and integration-level security tests where relevant. Keep vulnerability severity accurate, but route non-Critical security-only findings to lower-priority separate work items rather than repairs in this review/build. Critical findings still block and escalate; do not defer an independently blocking correctness defect merely because security found it.

6. **Backwards compatibility** — compare the previous contracts and operational assumptions with the reviewed snapshot using the checklist below. Receive applicable approved specification sections, preserved-behavior constraints, public consumers, persistence/cache formats, deployment files, and relevant compatibility-test evidence. Identify both unintended breaks and explicitly specified breaking changes; label their categories and disposition rather than treating every intentional change as a defect.

## Backwards compatibility

Review changed contracts against existing consumers and stored state, not only newly updated tests. Consider old and new versions running together during rollout and the documented rollback strategy; an explicitly specified coordinated cutover need not support a rolling upgrade. Use read-only inspection or safe isolated validation, never mutate live data, caches, or deployments. Inspect relevant callers, migrations, serializers, invalidation/versioning, manifests, and omitted-configuration paths. Report unverified assumptions and unavailable checks honestly.

| Category label | Check | Typical severity for an unplanned break |
| --- | --- | --- |
| **API** | Public routes, library signatures/exports, CLI flags, request/response/event shapes, status/error semantics, and existing consumers. | High for broken consumers; Critical for a severe public API break or broad outage; Medium for bounded compatibility impact. |
| **Data schema** | Existing records, columns/types/constraints, serialized files/messages, migration order, old readers/writers, and rollback readability. | High for unreadable existing state or failed rollout; Critical for irreversible data loss, corruption, or destructive migration. |
| **Cache** | Keys/namespaces, value serialization, TTL/defaults, invalidation, mixed-version readers/writers, stale data, and safe misses/rebuilds. | Medium for recoverable stale/missed entries; High for crashes, wrong outcomes, or material service overload; Critical for data loss or exposure. |
| **Deployment manifests** | Kubernetes/Helm/Compose/IaC/service manifests, images, env/config/secrets, ports/probes, resource/storage changes, and upgrade/rollback ordering. | High for deployment/startup failure; Critical for destructive resource changes or secret exposure; Medium for bounded operator reconfiguration. |
| **Default behaviour** | Omitted arguments/config, feature-flag defaults, timeouts/retries, permissions, ordering, and other previously implicit observable outcomes. | Medium for a bounded unexpected change; High for materially wrong outcomes; Critical for data loss or authentication/authorization failure. |

Severity follows demonstrated impact, not category alone. For every compatibility item, including those found by other lanes, append these labels to the normal finding format (use multiple category labels when applicable):

```text
Compatibility: API|Data schema|Cache|Deployment manifests|Default behaviour
Disposition: Unplanned break|Spec-approved change|Unclear
Unadjusted severity: Critical|High|Medium|Low|Info — <impact before any specification-based adjustment>
Spec evidence: <exact approved specification version and requirement, or None/Unclear with reason>
```

A **Spec-approved change** requires the exact approved specification version and requirement to explicitly describe the affected break/default change, its scope, and any required migration, invalidation, rollout, or compatibility safeguards. Verify the implementation matches it and those safeguards actually exist. Such an intentional change may be lowered to **Severity: Info**, with **Fix: None — specified intentional change**, while retaining its unadjusted severity, affected consumers/state, and operational consequences. It is not a required fix: list it under **Compatibility changes (spec-approved, non-blocking)**, not the blocking defect sections. These notes do not trigger build repair rounds; their presence yields PASS WITH NOTES when all other gates pass. The unadjusted severity is an impact label, not an active Critical/High verdict gate.

A vague mention of refactoring, a general version bump, an implementation plan alone, or an unapproved draft is not a compatibility exception. An absent or ambiguous specification gives no downgrade; standalone review still does not require inventing a spec. Use **Unclear** for unresolved intent, distinguish suspicion from confirmed breakage, and retain evidence-based severity. Specification approval does not waive failed checks, missing required evidence, deviations from the specified change, or independent security/correctness defects. Missing required safeguards remain separate findings at their actual severity; do not hide them in the intentional-change note. A documented migration is not permission to execute it during review.

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
const packet = "<repo/cwd/base/merge-base/HEAD/snapshot; full committed/staged/unstaged/untracked diff-scope references; finding format and read-only rules>";
const lanes = [
  ["lint", "Review lint, static checks, and build warnings", "<lint/build-specific brief, touched source files, safe commands, and warning attribution rules>"],
  ["maintainability", "Review maintainability", "<maintainability-specific brief>"],
  ["correctness", "Review behavior and document alignment", "<public entry points, applicable original intent/spec/plan/checklist versions and sections or session content, behavior and alignment brief>"],
  ["tests", "Review coverage and outside-in gates", "<applicable original requirements/scenarios and session content, author/implementer handoffs, assertion identities/revisions, initial RED, additional scenarios, integrated GREEN, and dependency evidence>"],
  ["security", "Review security boundaries", "<security-specific brief, safe checks, and lower-priority separate-work-item policy; Critical still blocks>"],
  ["compatibility", "Review backwards compatibility", "<API, Data schema, Cache, Deployment manifests, Default behaviour; previous consumers/state and rollout assumptions; applicable approved specification versions/requirements and safeguards; compatibility checks; category/Disposition/Unadjusted severity/Spec evidence labels; Spec-approved change notes are non-blocking only when implemented as specified>"]
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
- Do not change severity to make the result pass. Apply the explicit specification-backed compatibility adjustment above only after verifying its evidence; retain unadjusted impact and explain the lowered active severity. Preserve compatibility labels when deduplicating across lanes; do not duplicate an accepted change in blocking defect sections.
- Separate severity from scheduling priority: put non-Critical security-only findings in **Security follow-ups (separate work items, lower priority)**, retaining severity, evidence, impact, and the smallest remedy/work-item scope. These follow-ups do not block the verdict or trigger current build repair rounds, including when rated High. Propose work items in the report only; do not create tickets or modify a task ledger. Critical security findings stay in the blocking Critical section, and independent non-security defects retain normal gates.
- Consolidate document alignment and per-slice gate evidence separately from severity findings. Identify missing context, approval, historical RED, integrated GREEN, required checks, and unavailable lanes explicitly. These can block build completion even without a confirmed Critical/High code defect. Cite artifact/command evidence and distinguish child reports from independent verification.

Use these severities exactly for defects; intentional specification-backed compatibility changes use the labeled Info-note exception above:

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

## Compatibility coverage
- <each of API, Data schema, Cache, Deployment manifests, Default behaviour>: <No relevant change|Compatible|Unplanned break|Spec-approved change|Unclear> — <evidence or verification limit>

## Critical
- [lane; compatibility category/disposition when applicable] title — evidence; impact; fix

## High
...

## Medium
...

## Low
...

## Info
...

## Compatibility changes (spec-approved, non-blocking)
- [compatibility; category: <labels>; disposition: Spec-approved change; severity: Info; unadjusted: <severity>] <intentional change> — <spec version/requirement and code evidence>; <consumer/state/rollout consequences>; Fix: None — specified intentional change

## Security follow-ups (separate work items, lower priority)
- [security; severity: <High|Medium|Low|Info>] title — evidence; impact; separate work-item scope/fix

## Verdict
BLOCK — Critical findings, missing required plan context/alignment/approval/test-gate evidence, failed required checks, an unstable/uncovered snapshot, or an unavailable required review lane
HUMAN REVIEW — non-deferred High findings without another BLOCK condition
PASS WITH NOTES — all required gates satisfied; no Critical/non-deferred High findings; Medium/Low/Info or security follow-ups remain
PASS — all required gates satisfied; no actionable findings
```

Only include populated severity sections and compatibility-change notes; always include scope, document alignment, test-gate evidence, compatibility coverage for all five categories, reviewer availability, and verdict. All six review lanes are required for a plan-driven build; standalone review must also disclose any unavailable lane and cannot claim complete review. `Critical` always blocks automated progression; non-deferred `High` requires human review. Include the security follow-up section only when populated; retain each finding's true severity without duplicating it in the main severity sections. Missing required evidence or a failed required check is not a pass, regardless of code finding severity. Mention actual commands/results and failures separately; never turn a failing test into a code finding without explaining the affected behavior. Return the full report to build without modifying code or task progress.

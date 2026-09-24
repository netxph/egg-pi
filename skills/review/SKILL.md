---
name: review
description: Review the current branch against its merge-base using parallel specialist reviewers for linting, maintainability, correctness, tests, and security. Use only when the user explicitly invokes /skill:review.
disable-model-invocation: true
---

# Branch review

Run a read-only, evidence-based review of the current branch. Do not edit files, fix findings, commit, or push.

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
```

If the supplied/default ref is missing, use an existing `main`, `master`, or upstream tracking ref; if no base can be resolved, stop and report that instead of guessing. Review only changes reachable in `merge_base...HEAD`, plus the surrounding code needed to verify their behavior. Do not report pre-existing issues unless the branch makes them reachable or materially worse.

Include the exact base ref and merge-base SHA in every reviewer prompt.

## Review fan-out

After resolving the scope, launch these independent fresh-context `reviewer` agents in parallel with `subagent`/`workflowScript` and `runs.all`:

1. **Linting/static checks** — inspect changed files and run the repository's existing lint, formatter, type-check, and static-analysis commands where practical. Report real failures and suspicious changed-code patterns, not formatter preferences.
2. **Code smells/maintainability** — look for unnecessary complexity, duplication, unsafe abstractions, dead code, compatibility hazards, and disproportionate maintenance cost introduced by the branch.
3. **Correctness/behavioral** — trace changed behavior and callers; find regressions, edge cases, broken contracts, race/state errors, error-handling gaps, and API behavior changes.
4. **Test completion** — compare changed behavior with existing unit and integration coverage; run focused tests and identify concrete missing cases, weak assertions, or untested failure paths.
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

Use a workflow like this (adapt task text to the resolved repository and scope):

```ts
subagent({
  context: "fresh",
  workflowScript: `
    const scope = ${JSON.stringify("Repository: <cwd>; base: <base_ref>; merge-base: <merge_base>; diff: <merge_base>...HEAD")};
    const jobs = await runs.all([
      { key: "lint", phase: "Review", label: "Review lint and static checks", agent: "reviewer", task: scope + "\\nReview linting and static checks. Do not modify files. Return only evidence-backed findings in the required format." },
      { key: "maintainability", phase: "Review", label: "Review maintainability", agent: "reviewer", task: scope + "\\nReview code smells and maintainability. Do not modify files. Return only evidence-backed findings in the required format." },
      { key: "correctness", phase: "Review", label: "Review behavioral correctness", agent: "reviewer", task: scope + "\\nReview correctness and behavioral regressions. Do not modify files. Return only evidence-backed findings in the required format." },
      { key: "tests", phase: "Review", label: "Review test completion", agent: "reviewer", task: scope + "\\nReview unit and integration test completion. Run focused existing checks when useful; do not modify files. Return only evidence-backed findings in the required format." },
      { key: "security", phase: "Review", label: "Review security boundaries", agent: "reviewer", task: scope + "\\nReview security and security tests at unit and integration levels. Do not modify files. Return only evidence-backed findings in the required format." }
    ]);
    return jobs.map(job => job.output);
  `
})
```

Do not force a hard tool budget on reviewers. Keep prompts distinct, and include the actual diff scope rather than relying on conversation history. If a reviewer fails, record the lane as unavailable; do not silently treat it as clean.

## Consolidation

After all lanes finish, consolidate findings yourself:

- Deduplicate the same root cause reported by multiple lanes.
- Verify each accepted finding against the current branch and diff; discard unsupported speculation and pre-existing unrelated issues.
- Preserve the strongest evidence and list corroborating lanes.
- Separate required fixes from observations and missing-but-low-risk polish.
- Do not change severity to make the result pass.

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
Compared: <merge-base>...HEAD
Reviewers: <completed>/<total>; unavailable: <lanes or none>

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
BLOCK — Critical findings or an unavailable required security/correctness lane
HUMAN REVIEW — High findings
PASS WITH NOTES — no Critical/High findings; Medium/Low/Info remain
PASS — no actionable findings
```

Only include populated sections. `Critical` always blocks automated progression. `High` always requires human review. An unavailable correctness or security lane is not a pass: say so in the verdict and report the missing evidence. Mention commands run and failures separately; never turn a failing test into a finding without explaining the affected behavior.

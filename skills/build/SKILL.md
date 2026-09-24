---
name: build
description: Iteratively implement and review the current coding task by running `/skill:code` and `/skill:vet` for up to three rounds, stopping when the review has no Critical or High findings. Use only when the user explicitly invokes /skill:build.
disable-model-invocation: true
---

# Build loop

Drive the current user-requested coding task through implementation and review. Do not invent requirements; ask the user when the task, an accepted fix, or review scope is ambiguous.

## Missing task

If no coding task can be determined from the invocation and conversation, ask the user:

> I don't have a coding task to implement. May I run `/skill:vet` first to review the current branch, then use its confirmed findings as the task and continue the build loop?

If the user agrees, run `/skill:vet` first. Use its confirmed Critical and High findings as the implementation task for the loop, then continue with the normal `/skill:code` → `/skill:vet` cycle. If the user declines, stop without editing files.

## Loop

Run at most three rounds. In each round:

1. Invoke `/skill:code` with the original task and the current review findings, if any. Tell it to fix only confirmed Critical and High findings first, then any directly necessary related issues. It owns implementation and validation; it must not make speculative changes.
2. Invoke `/skill:vet` after `/skill:code` finishes. Preserve `/skill:vet`'s read-only behavior: it must not edit files, fix findings, commit, or push.
3. Parse the complete vet report. If there are no Critical or High findings, stop successfully. Medium, Low, and Info findings do not trigger another round unless resolving them is necessary to address a Critical or High finding.
4. If Critical or High findings remain and rounds remain, pass the exact findings, evidence, and requested fixes to the next `/skill:code` invocation.

Never run a fourth round. If `/skill:code` or `/skill:vet` fails or is unavailable, stop rather than treating the round as clean and report the failure.

## Scope caveat

The existing `/skill:vet` reviews the committed branch range `merge-base...HEAD`. `/skill:code` normally leaves edits uncommitted. Do not create commits merely to make the review pass. After each vet, explicitly check and report whether relevant work remains uncommitted; if so, state that vet may not have reviewed those working-tree changes. Do not claim that the task is clean when vet did not cover the relevant changes.

## Final report

At the end, report:

- The number of rounds run and why the loop stopped.
- Files and user-visible changes made, based on the implementation result and final diff/status.
- Checks run by `/skill:code`, including failures.
- The complete result of the **last `/skill:vet`**, preserving its Base, Merge-base, Compared range, reviewer availability, findings grouped by severity, commands/failures, and Verdict. Keep exact evidence, file paths/lines, impact, fixes, confidence, and unavailable lanes because this report is intended for handoff to the harness or continued resolution.
- Any uncommitted-scope limitation or unresolved Critical/High finding.

If the final vet has no Critical or High findings but has lower-severity findings, say so plainly; do not silently drop them. If the loop reaches round three with Critical or High findings, report that the build is blocked and list the remaining findings.

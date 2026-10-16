# egg-pi

A [pi](https://pi.dev) package.

## Package contents

Add pi resources to the corresponding directory:

- `extensions/` — JavaScript or TypeScript extensions
- `skills/` — directories containing `SKILL.md` files
- `prompts/` — prompt templates
- `themes/` — theme JSON files

The package manifest is defined in `package.json` under the `pi` key.

## Spec-driven workflow

- `/skill:design <intent path or description>` — Inspect current behavior and feature entry points, interview for missing decisions, and return a concise behavioral `spec.md` for review. An existing `/slice` record is also valid input.
- `/skill:plan <approved spec path or pasted spec>` — Require explicit spec approval, then return `plan.md` and `todo.md`: vertical delivery slices first, horizontal outside-in TDD tasks within each slice, and dependency-safe parallel groups.

Both skills ask for missing input, stay read-only, and return Markdown in chat. Plan always returns two separate, mutually linked documents: `plan.md` and `todo.md`. They save only when explicitly requested and destinations are confirmed. Working drafts may list blockers; review-complete documents must answer every section. Spec and plan approval are separate, and neither skill starts implementation.

For capture, slice, design, and plan, implementation progress comes **only from the matching plan todo**. Missing or unchecked entries count as pending for planning, even when recovering documents from an already implemented branch. Code inspection still informs behavior, entry points, feasibility, and reuse; it does not auto-complete tasks or remove requested scope. Existing todo progress is preserved. This is a planning assumption, not a claim that code is absent: build still reconciles the actual source and run state before making changes.

Every delivery slice plans an outside acceptance/integration test that runs and fails for the missing behavior before implementation, then passes through the real integration at completion. Parallel groups name their prerequisites, write boundaries, isolation needs, and integration gate. Existing behavior that already passes requires an explicit decision, not a manufactured failure.

The templates follow the local *Spec-Driven Development with AI* research, adapting patterns from OpenSpec, GitHub Spec Kit, Superpowers, Addy Osmani, and Matt Pocock. Source links are included in each skill.

No short `/design` or `/plan` aliases are registered. Run `/reload` after adding or changing these skills in an active Pi session.

## Implementation and review

- `/skill:build <plan path or pasted plan>` — Execute an approved plan, or ask which plan to use from session history. Resolve its related design/spec, intent, and checklist through document references, verified same-directory candidates, or session context. Schedule dependency-ready asynchronous work through code, integrate it, then run vet; at most three implementation/review rounds.
- `/skill:code <task>` — Always delegate implementation to fresh-context pi-subagents workers, even for a one-line change. Build supplies the plan context and ready tasks; standalone tasks do not require inventing a plan. The parent coordinates and verifies instead of implementing directly.
- `/skill:vet [base ref]` — Run five fresh, read-only specialist reviews of committed plus staged, unstaged, and untracked changes. For plan-driven work, also check intent/spec/plan alignment and actual per-slice outside RED, integrated GREEN, and regression evidence.

Build finds the matching todo document in a file or the current session; saving the plan or todo is not required to start. It updates a file-backed todo in place, or returns the complete updated todo in chat for session-backed tracking. Updates include verified checkboxes, test evidence, active run/worktree ownership, blockers, review rounds, and the next action. Save documents only when you instruct the harness to do so, using the directory you specify. On restart, build reconciles the latest available checklist with actual source/run state before continuing; it does not blindly repeat checked tasks or launch duplicate workers. A new session needs the saved documents, supplied latest todo/context, or access to prior history—session-only tracking is not guaranteed cross-session persistence.

Missing context, unapproved/out-of-sync contracts, missing required test evidence, failed required checks, or unavailable required reviewers block build completion. Critical/High findings require escalation before repair. Parallel writers use separate worktrees; dirty or dependency-incomplete checkouts serialize safely rather than auto-committing or discarding work. Neither worker completion nor a passing isolated lane proves the integrated build is complete.

## Feature changes

- `/skill:delta <requested change> <target feature>` — Accept two inputs: what you want to change, and the target feature's intent, design/spec, plan, and todo. Supply the target via a folder, paths/references or content specified in the prompt, or matching documents in the current session; no rigid argument syntax or saved files are required. Delta asks for either missing or ambiguous input, then revises the existing slice through capture → design → plan, interviewing one question at a time. It does not invoke slice or re-slice the feature.

Delta preserves unaffected scope, stable IDs, recorded todo progress, and execution history. It obtains acceptance of revised slice intent, approval of the exact revised spec before planning, and separate plan approval—none starts implementation. Invalidated completed tasks require an explicit disposition; new work starts unchecked. A final whole-set check verifies coverage, references, dependencies, and progress consistency. Complete revised documents stay in chat unless you explicitly request saving with confirmed destinations. Delta plans a requested change; sync diagnoses existing drift, and recover reconstructs missing documents from code.

Example: `/skill:delta Allow customers to reschedule a booking; use the intent/spec/plan/todo in docs/booking/ and preserve cancellation behavior.`

Run `/reload` after adding the skill; no short `/delta` alias is registered.

## Recovery and synchronization

- `/skill:recover <feature or repository scope>` — Inspect the current implementation, interview for intent, and apply capture → slice → design → plan in chat. Recover the full document set, then propose todo statuses with code/test evidence. Specific completion candidates require your confirmation; unavailable evidence stays pending. Historical RED, original approvals, and execution order are never invented. No files are saved and no implementation is performed.
- `/skill:sync <document folder or explicit intent/spec/plan/todo references> [base ref]` — Resolve the current repo/branch and Git merge-base, compare the documents against each other and committed plus local changes, and report out-of-sync items first. Compare content only: Draft/Approved labels and missing approval records do not count as discrepancies or block sync. Wait for permission to apply specific item IDs and resolution directions before returning revised documents in chat. Edit document files only on explicit request; code fixes need a separate build/code request.

Recovery's confirmed, evidence-backed todo reconciliation is an explicit exception to automatic pending status—not permission for ordinary capture/slice/design/plan to infer completion from code. Recovered implementation completion does not imply historical test gates or build readiness. Both workflows retain existing document templates and stable IDs. Recovery preserves stage approval boundaries; sync checks actual design/intent content without importing document-approval gates, while still requiring consent before resolving reported items.

## Ask-user-question tool

`ask_user_question` starts single-select by default: Enter immediately submits the highlighted choice. **Space on any normal choice always enables multi-select and toggles that choice**, even if `multiSelect` was omitted or false. Set `multiSelect: true` to start in multi-select mode:

```json
{
  "question": "Which checks should run?",
  "options": ["Unit tests", "Integration tests", "Lint"],
  "multiSelect": true
}
```

Long questions, option labels, and keyboard hints wrap to the available width; option continuation lines align with their text. Recommended options remain bold across wrapping.

In multi-select mode, use **Space** to toggle choices and **Enter** on a normal choice to submit the checked answers. The last option always lets you type an answer: Enter saves it, then Enter on a normal choice submits it together with any checked choices. Reopen the typed answer to edit it or submit blank text to clear it. With no supplied choices, typed input submits directly. Esc leaves editing or cancels the question.

Generic English placeholders such as “Custom answer,” “Other (please specify),” and “The user will type an answer” are filtered from supplied options. Substantive choices such as “Use a custom API” remain. Results include an `answers` array while retaining the existing `answer` string and `wasCustom` flag.

Run the tool interaction and skill-contract checks using your installed Pi package directory (these do not launch real workers):

```bash
PI_PACKAGE_DIR=/path/to/node_modules/@earendil-works/pi-coding-agent \
  node --test tests/*.test.mjs
```

## Use locally

```bash
pi install .
```

To try the package for one run without adding it to settings:

```bash
pi -e .
```

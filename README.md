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

- `/skill:slice <intent document path>` — Find the smallest safe, useful MVP with SPIDR and other slicing techniques, then add deferred functionality in later increments. Output a flat sequence of ordinary capture-format intent documents, MVP first—not `SLICE-*` records or a parent/child hierarchy. Only frontmatter links the source (`parent_intent`), peer intent/related work references (`related_work`), and genuine prerequisites (`dependencies`, a flat list, not repeated in the body). Each document stands alone, uses an outcome title, and retains essential safety controls. Questions focus on what must ship now and what can safely wait. Results stay in the session unless you ask to save them; file input does not authorize updates. Requested saves use short, descriptive kebab-case filenames such as `registration-basic.md` in one flat directory (your specified filenames/directory take precedence; otherwise the current directory). Existing files are never overwritten without permission.
- `/skill:design <intent.md or delta.md>` — Inspect current behavior and feature entry points, interview for missing decisions, and return a behavioral `spec.md` for review. Baseline intent (including an existing `/slice` record) produces the full feature contract. Delta input resolves its baseline and explicitly included prior changes, assumes baseline delivery is completed for scoping, and produces only a change-scoped spec with `source_delta` provenance. It does not generate an implementation plan; `/plan` handles that after exact spec approval. File, pasted, and unambiguous session inputs are supported.
- `/skill:plan <approved spec path or pasted spec>` — Require explicit approval of the related spec, then generate only its `plan.md` and `todo.md`: vertical delivery slices first, horizontal outside-in TDD tasks within each slice, and dependency-safe parallel groups. The supplied spec defines the scope. For a change spec, assume baseline delivery is completed, schedule only the specified changes and necessary integration/regression checks, and use only that change's todo for progress. Upstream documents are consulted only for a concrete missing detail or contradiction—not to repeat discovery, expand scope, or prove baseline completion.

Capture alone uses an input-driven workflow; design and plan retain their normal document-first workflows, without capture phases:

1. **Lazy prompt → expanded document:** `/skill:capture <lazy prompt>` returns the full capture template prefilled from your request, integrating its meaning into direct problem and outcome statements and leaving unsupported fields unknown. It reads as an intent document, not “the user wants…” narration, and excludes original-prompt blocks and transcripts. Any readable input that does not conform to the capture template counts as a lazy prompt. No Open Questions or interview yet; you can enrich the document yourself.
2. **Capture document → open decisions:** `/skill:capture intent.md` (or an explicitly identified conforming capture in the session) gathers remaining decisions and adds Open Questions without another phase command. Standalone file input is edited directly, including after interview answers; session/pasted input is revised in chat unless you request saving. Explicit save requests are allowed at any step, including incomplete drafts and later save-only turns. New files default to `intent.md` in your requested directory, or the current working directory; explicit destinations take precedence. Existing file-backed updates retain their input path unless redirected. Unrelated existing content is not overwritten without permission. File read/write failures are reported, not silently redirected. Recovery/sync retain their coordinator's no-save and approval rules.

When you explicitly request an interactive user interview, capture works through all questions and follow-ups, updating the document after each answer. A successful interview leaves no unresolved decisions and removes Open Questions entirely. Cancellation or unavailable answers pause the interview with remaining questions intact—never a false claim of completion. Neither completing the interview nor editing the document accepts the intent for you. No phase metadata is needed.

When gathering decisions, capture, design, and plan use document-first questions: record stable `Q-` entries in a nested Open Questions subsection of the existing uncertainty/review section before asking anyone. Each entry includes the affected outcome/task, answer or unknown, evidence/source, disposition, and blocking impact. Answer supported questions directly in the document; label recommendations as proposals, not user decisions. Once a question is addressed, incorporate its answer and evidence into the relevant sections and remove it from Open Questions. Omit the entire Open Questions subsection when empty—no empty heading or None placeholder. When an agent/supervisor interview channel is available, hand the questions and context to the harness to interview the agent and reconcile its answers. Otherwise return the draft with unresolved questions intact—no new interview workers or immediate user prompts. User interviews via `ask_user_question` happen only when explicitly requested. Agent answers cannot grant consent or approval; consequential unknowns and existing approval gates still block progress. Missing spec approval produces a blocked plan/todo draft pair without executable tasks.

Both design and plan stay read-only and return Markdown in chat. Plan always returns two separate, mutually linked documents: `plan.md` and `todo.md`. They save only when explicitly requested and destinations are confirmed. Working drafts may list blockers; review-complete documents must answer every section. Spec and plan approval are separate, and neither skill starts implementation.

Capture, design, and plan explicitly cover **API**, **Data schema**, **Cache**, **Deployment manifests**, and **Default behaviour**. Each output includes a Backwards Compatibility subsection. Capture asks about existing-user/operator outcomes and acceptable disruption without designing internals; design records preservation obligations or explicitly confirmed breaks with requirement/scenario IDs; plan maps those decisions to safeguards, tasks, and compatibility checks. Each stage documents unresolved decisions before any interview, reuses earlier answers, and records justified inapplicability rather than assuming safety. Capture may record unknowns; consequential unknowns block a complete spec/plan. Vet's intentional-change exception must trace back to the exact approved specification, not just capture consent or a plan.

For capture, slice, design, and plan, implementation progress comes **only from the matching plan todo**. Missing or unchecked entries count as pending for planning, even when recovering documents from an already implemented branch. Code inspection still informs behavior, entry points, feasibility, and reuse; it does not auto-complete tasks or remove requested scope. Existing todo progress is preserved. This is a planning assumption, not a claim that code is absent: build still reconciles the actual source and run state before making changes. **Delta-scoped exception:** design and plan treat baseline delivery as already completed context without requiring baseline todo evidence or reopening baseline work. New delta work still uses its own matching todo and starts pending; the assumption does not fabricate baseline verification or change ordinary branch recovery.

Every delivery slice plans an outside acceptance/integration test that runs and fails for the missing behavior before implementation, then passes through the real integration at completion. Parallel groups name their prerequisites, write boundaries, isolation needs, and integration gate. Existing behavior that already passes requires an explicit decision, not a manufactured failure.

The templates follow the local *Spec-Driven Development with AI* research, adapting patterns from OpenSpec, GitHub Spec Kit, Superpowers, Addy Osmani, and Matt Pocock. Source links are included in each skill.

No short `/design` or `/plan` aliases are registered. Run `/reload` after adding or changing these skills in an active Pi session.

## Implementation and review

- `/skill:build <context folder, plan path, or pasted plan>` — Execute one active baseline or delta context's approved plan/spec/todo. A folder selects its plan.md; a plan file selects its containing folder. With no input, use an unambiguous active session context or the current directory's own plan.md; otherwise ask. Never walk to an ancestor plan, choose the newest delta, or substitute baseline/sibling spec/todo files. Linked intent/delta history stays read-only context. Progress, evidence, and review rounds belong only to the active context; source edits and tests run in the target source repo/worktree, not the planning folder. Schedule dependency-ready asynchronous work through code, integrate it, then run vet; at most three implementation/review rounds.
- `/skill:code <task>` — Always delegate implementation to fresh-context pi-subagents workers, even for a one-line change. Behavioral changes use an independent acceptance-test author, then an implementer who owns internal unit tests and production code. Build supplies the plan context and ready tasks; standalone tasks do not require inventing a plan. The parent coordinates and verifies instead of implementing directly.
- `/skill:vet [base ref]` — Run six fresh, read-only specialist reviews of committed plus staged, unstaged, and untracked changes, including a dedicated backwards-compatibility checker. For plan-driven work, also check intent/spec/plan alignment and actual per-slice outside RED, integrated GREEN, and regression evidence.

Vet labels compatibility items as **API**, **Data schema**, **Cache**, **Deployment manifests**, or **Default behaviour**, with severity, disposition, and specification evidence. Breaking changes explicitly covered by the approved specification and implemented with its required safeguards can become non-blocking Info notes, with their original impact severity retained. They do not require fixes or trigger build repair rounds. Unspecified breaks, missing safeguards, and independent defects keep their normal severity and gates.

Capture → slice → design establish the behavioral contract before build; build consumes the approved specifications rather than repeating their interviews. Coordinators retain full context, while workers and vet specialists receive role-focused requirements, exact source/document references, and relevant evidence instead of the entire orchestration history. Relevant session-only content is included directly.

Every coding worker—including acceptance authors, integration workers, and repairs—first reads and applies `prompts/lc.md` with explicit task guidance, then executes its focused assignment in the same fresh session. This applies the `/lc` workflow without relying on slash-command expansion or waiting for another turn. Role boundaries, outside-in gates, and no-recursion rules still apply; no model change is implied.

Implementation defaults to **one implementer per coherent slice or bounded change**, not one worker per atomic todo action. That worker handles related production changes, internal tests, wiring, and relevant documentation in dependency order, returning evidence for each task ID. All external prerequisites must pass before dispatch; internal prerequisites are verified in the same assignment. Acceptance authorship, build-owned checklist updates, integrated GREEN acceptance, and vet remain separate. Split implementation only for a required external gate, incompatible ownership, or genuine safe parallelism; interrupted work resumes through a fresh replacement with only the reconciled remainder.

The acceptance-test author works through the public boundary without private implementation assumptions. The implementer may run, but not rewrite, acceptance tests or their fixtures; suspected test defects return to the coordinator and a fresh test author. Each slice still requires meaningful outside RED before production implementation. Implementation of slice A can overlap acceptance-test authorship for independent slice B, and additional already-agreed scenarios can be written alongside implementation after initial RED. Tests run early, during development, and after serial integration—not only at the end. Vet independently checks assertions against the specification, test-version/RED evidence, and final integrated GREEN.

For example, `/skill:build plans/checkout/` builds the baseline, while `/skill:build plans/checkout/changes/001-credit-card/` builds only that delta's plan. Neither invocation creates or generates missing documents; missing or cross-context references require clarification.

Build finds only the active context's matching todo document in a file or the current session; saving the plan or todo is not required to start. It updates a file-backed todo in place, or returns the complete updated todo in chat for session-backed tracking. Updates include verified checkboxes, test evidence, active run/worktree ownership, blockers, review rounds, and the next action. Save documents only when you instruct the harness to do so, using the directory you specify. On restart, build restores the checkpoint's active context identity, verifies its exact plan/spec/todo references, and reconciles the latest checklist with actual source/run state before continuing; it does not switch contexts, repeat checked tasks blindly, or launch duplicate workers. Baseline builds may update their own todo; delta builds update only the delta todo and leave the baseline and previous packages untouched. A new session needs the saved documents, supplied latest todo/context, or access to prior history—session-only tracking is not guaranteed cross-session persistence.

Build's final report includes an **Execution Timing** table with timezone-qualified start/end timestamps and elapsed times for preflight, acceptance authorship/RED validation, implementation and internal tasks, integration/GREEN, vet rounds, consolidation, and repairs. Parent dispatch-to-result intervals and worker task timings are distinguished; overlapping intervals are not summed. Total wall time and user-wait intervals are separate, and unavailable timings remain unknown. The checkpoint preserves timing evidence across resumes. A **Human Verification Log** counts answered build-stage approvals, confirmations, and manual validations once per interaction, with reasons, affected gates, timestamps, response references, and outcomes. Pending/cancelled prompts and clarification-only interactions are separate; prior approvals, the build invocation, and agent-only checks do not count. Missing history produces a known lower bound, not a fabricated exact total. No extra approval gates are introduced.

Missing context, unapproved/out-of-sync contracts, missing required test evidence, failed required checks, or unavailable required reviewers block build completion. Critical/High findings require escalation before repair. Parallel writers use separate worktrees; dirty or dependency-incomplete checkouts serialize safely rather than auto-committing or discarding work. Neither worker completion nor a passing isolated lane proves the integrated build is complete.

## Feature changes

- `/skill:delta <baseline intent> <short change summary>` — Read the baseline intent and interview you one focused question at a time until all intended changes and follow-ups are clear. File, pasted, and unambiguous session intents are accepted; spec/plan/todo are not required. No assumptions, baseline rewrites, downstream document generation, or implementation. The result is one `delta.md` in chat, recording the reason, baseline, explicit Add/Modify/Remove changes, preserved behavior, success signals, constraints, and decisions. An interrupted interview keeps unresolved questions visible in an incomplete draft.

Only an explicit save request creates `<baseline folder>/changes/NNN-description/delta.md`, for example `plans/checkout/changes/001-credit-card/delta.md`. The next number is the highest existing numbered directory plus one (starting at `001`); the descriptive suffix is lowercase kebab-case. Delta asks for the baseline folder when the intent is session-only. Baseline intent/spec/plan/todo and previous change packages remain untouched. Existing deltas are never overwritten, and folder numbers do not imply approval or application. Saving preserves draft status and does not start another workflow. Explicitly identify prior deltas if the proposal depends on them; they are not automatically folded into the baseline.

Example: `/skill:delta plans/checkout/intent.md Add credit-card payments while preserving the existing payment options.`

Then: `Save this delta.`

Next: `/skill:design plans/checkout/changes/001-credit-card/delta.md`. Design returns a change-scoped spec in chat, mapping each `D-` change to requirements/scenarios and preserving unaffected baseline behavior. Explicit delta changes are compared against baseline + included prior changes + delta, not flagged as drift against the baseline alone. Missing decisions or source contradictions are surfaced rather than guessed. When requested, save the spec beside the delta, never over the baseline spec. After approving that spec, invoke `/skill:plan plans/checkout/changes/001-credit-card/spec.md` to get only the change's plan/todo with integration and regression checks. Planning does not require rereading the whole baseline/delta chain when the approved spec is self-contained, and it records baseline completion as a scoping assumption rather than verification evidence. Build/vet follow the same delta provenance and effective-intent rules; change approvals and verification remain mandatory. No baseline documents or previous completed packages are rewritten.

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

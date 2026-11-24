# egg-pi

A [pi](https://pi.dev) package with coding-workflow prompts, spec-driven development skills, and an interactive question tool.

## Contents

- [Installation](#installation)
- [Prompts](#prompts)
- [Skills](#skills)
- [Workflows](#workflows)
- [Behavior](#behavior)
- [Tools](#tools)
- [Package layout](#package-layout)
- [License](#license)

## Installation

```bash
# Install from a local checkout
pi install .

# Or try it for one run without saving to settings
pi -e .
```

### Recommended companion packages

`scripts/init.sh` (Arch Linux) and `scripts/init.ps1` (Windows) install `codebase-memory-mcp` plus these pi packages:

| Package | Purpose |
|---|---|
| `@dietrichgebert/ponytail` | Minimal-change coding mode |
| `pi-mcp-adapter` | MCP server support |
| `pi-subagents` | Subagent delegation (required by `code`, `build`, `vet`) |
| `pi-web-access` | Web search and fetch (used by `/research`) |
| `pi-cbm` | Codebase-memory code graph tools |
| `pi-lmstudio` | LM Studio local models |

```bash
./scripts/init.sh          # Linux
./scripts/init.ps1         # Windows (PowerShell)
```

Run `/reload` in an active session after installing or changing resources.

## Prompts

| Command | Description |
|---|---|
| `/bc [guidance]` | Big-model coding workflow for frontier models: resolve ambiguity, keep changes minimal and surgical, verify before reporting. Authorizes subagent delegation for the session. |
| `/lc [guidance]` | Compact coding workflow for small local models. Also applied by every `code` worker. |
| `/research <topic>` | Evidence-based research article using parallel research and adversarial review. |

Without arguments, `/bc` and `/lc` only change session behavior; work starts on your next message.

## Skills

All skills are invoked explicitly with `/skill:<name>`. None are auto-invoked by the model.

### Documents

| Command | Input | Output |
|---|---|---|
| `/skill:capture <prompt \| intent.md>` | Lazy prompt or capture document | Prefilled `intent.md`; on a capture document, adds Open Questions |
| `/skill:slice <intent.md>` | Intent document | Flat sequence of standalone intent documents, MVP first |
| `/skill:design <intent.md \| delta.md>` | Intent or delta | Behavioral `spec.md` (full or change-scoped) |
| `/skill:plan <spec.md>` | **Approved** spec | `plan.md` and `todo.md` |
| `/skill:delta <intent.md> <summary>` | Baseline intent + change summary | `delta.md` |

### Implementation

| Command | Description |
|---|---|
| `/skill:build [context folder \| plan.md]` | Execute an approved plan through `code` and `vet`, up to three implementation/review rounds |
| `/skill:code <task>` | Implement via fresh subagent workers using outside-in TDD |
| `/skill:vet [base ref]` | Six parallel read-only reviews of committed and uncommitted changes |

### Maintenance

| Command | Description |
|---|---|
| `/skill:recover <scope>` | Reconstruct intent → slices → spec → plan/todo from existing code |
| `/skill:sync <folder \| docs> [base ref]` | Report where documents and code have drifted; revise only approved items |

## Workflows

### New feature

```text
/skill:capture Add a checkout page with saved carts
/skill:capture .pi/plans/checkout/intent.md   # gather open decisions
/skill:slice   .pi/plans/checkout/intent.md   # optional: split into MVP + increments
/skill:design  .pi/plans/checkout/intent.md
/skill:plan    .pi/plans/checkout/spec.md     # after you approve the spec
/skill:build   .pi/plans/checkout/
```

### Feature change

```text
/skill:delta  plans/checkout/intent.md Add credit-card payments
Save this delta.                         # -> plans/checkout/changes/001-credit-card/delta.md
/skill:design plans/checkout/changes/001-credit-card/delta.md
/skill:plan   plans/checkout/changes/001-credit-card/spec.md
/skill:build  plans/checkout/changes/001-credit-card/
```

Delta work assumes the baseline is delivered and never rewrites baseline documents or earlier change packages.

### Existing code

```text
/skill:recover src/checkout      # rebuild documents from code
/skill:sync    plans/checkout/   # find drift between docs and code
```

## Behavior

### Saving

- Documents are returned in chat. Nothing is saved unless you ask.
- Default capture path: `.pi/plans/<title>/intent.md`. Explicit paths take precedence.
- Delta path: `<baseline folder>/changes/NNN-description/delta.md`.
- Existing files are never overwritten without permission.

### Approval gates

- `plan` requires an approved spec. Without approval it returns a blocked draft.
- Spec and plan approvals are separate. No document skill starts implementation.
- `recover` asks you to confirm any task it marks complete.
- `sync` reports issues first and changes only the items you approve.

### Open Questions

- Unresolved decisions are recorded as `Q-` entries under an Open Questions subsection.
- Answered questions are folded into the document and removed.
- User interviews happen only on request (via `ask_user_question`).
- Agent answers never count as user approval.

### Backwards compatibility

Capture, design, plan, and vet track five areas: **API**, **Data schema**, **Cache**, **Deployment manifests**, **Default behaviour**. Breaking changes approved in the spec and implemented with their safeguards are reported by vet as non-blocking Info.

### Progress tracking

- Progress comes only from the matching `todo.md`. Missing entries count as pending.
- `build` updates the todo in place (file) or returns it in chat (session).
- `build` resumes from the todo and reconciles it with the actual source before continuing.
- The final build report includes an **Execution Timing** table and a **Human Verification Log**.

### Testing

- Each slice gets an outside acceptance test that fails (RED) before implementation and passes (GREEN) after integration.
- Acceptance tests are written by a separate worker; the implementer cannot change them.
- Parallel writers use separate worktrees.

## Tools

### `ask_user_question`

Interactive question with selectable options.

```json
{
  "question": "Which checks should run?",
  "options": ["Unit tests", "Integration tests", "Lint"],
  "recommended": "Unit tests",
  "multiSelect": true
}
```

| Key | Action |
|---|---|
| Enter | Submit highlighted choice (single-select) or checked choices (multi-select) |
| Space | Toggle a choice; switches to multi-select |
| Esc | Leave editing or cancel |

- The last option is always a typed answer.
- Placeholder options such as "Other (please specify)" are filtered out.
- Results include `answers` (array), `answer` (string), and `wasCustom`.

## Package layout

```text
extensions/   ask-user-question.ts
prompts/      bc.md, lc.md, research.md
skills/       build, capture, code, delta, design, plan, recover, slice, sync, vet
scripts/      init.sh, init.ps1
themes/       (empty)
```

Resources are registered in `package.json` under the `pi` key.

## License

[MIT](LICENSE)

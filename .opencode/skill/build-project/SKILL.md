---
name: build-project
description: Use when the user wants to start, scaffold, or build a new project from scratch. Drives a phased, checklist-driven build workflow where progress is tracked in build.md. Trigger on "create a project", "build a project", "scaffold", "start a new app", or any request to begin a project.
---

# Build Project Workflow

You are a project-building assistant. You drive the user's new project through a
fixed set of phases. Each phase is a group of steps; every step is a checklist
item you complete and mark off. **All progress is recorded in `build.md` at the
project root**, which is the single source of truth (so it survives session
compaction and restarts).

## Core rules

1. **One file to rule them all:** `build.md` holds the project description, tech
   stack, skills/tooling inventory, and phase progress. Create it on first run
   (see template below). Never let it go stale — update it as you finish steps.
2. **Checklist discipline:** every step is a Markdown task `- [ ]`. Mark `- [x]`
   only when the step is genuinely done and verified.
3. **Phase gating:** do not start the next phase until the current phase's steps
   are complete AND the user has signed off. Ask: *"Phase N complete. Proceed to
   Phase N+1?"* Use the `question` tool when you need a decision.
4. **Clarify before assuming:** in Phase 0, ask real questions (use `question`).
   Derive the project description from the user's answers. Do not invent
   requirements.
5. **Skills/tooling inventory:** in Phase 2, enumerate every tool/skill/MCP
   server the build needs. For each, record install status and a *working
   status* you actually verified (e.g. ran `node -v`, hit an endpoint). Never
   mark "working" without checking.
6. **Work in the real repo:** scaffold and implement for real; don't just write
   docs. Use `todowrite` as a live in-session mirror of the checklist, but
   `build.md` is authoritative.

## The phases

### Phase 0 — Discovery & Clarification
- [ ] Ask clarifying questions (purpose, users, platform, scale, constraints, must-haves/non-goals)
- [ ] Write the **Project Description** section in build.md from the answers
- [ ] Capture each Q&A as a decision line under "Clarifications & Decisions"
- [ ] Confirm scope and success criteria with the user

### Phase 1 — Tech Stack Selection
- [ ] Propose a concrete stack (language, framework, runtime, database, infra, testing)
- [ ] State the *reasoning* for each choice and note alternatives considered
- [ ] Confirm the stack with the user; record final choices in the **Tech Stack** section
- [ ] Note any stack-level risks or open questions

### Phase 2 — Skills & Tooling Inventory
- [ ] List every skill/tool/MCP server the build requires
- [ ] Check install status for each (command exists? package installed?)
- [ ] Verify working status for each (actually run/invoke it; record the proof)
- [ ] Install or flag anything missing; re-verify before marking done
- [ ] Record all of this in the **Skills & Tooling Inventory** table

### Phase 3 — Scaffolding
- [ ] Initialize the project (repo, package manager, folder structure)
- [ ] Apply the chosen tech stack's base config (lint, fmt, CI, env)
- [ ] Create a minimal runnable "hello world" / smoke entrypoint
- [ ] Confirm it builds/runs locally

### Phase 4 — Implementation
- [ ] Break the product into features; list each as a sub-checklist
- [ ] Implement features one at a time, marking steps as you go
- [ ] Keep build.md's progress section updated per feature
- [ ] Pause for user review at meaningful milestones

### Phase 5 — Verification
- [ ] Run the test suite / type checks / linters
- [ ] Manually verify core flows (use browser/MCP tools if available)
- [ ] Fix issues found; re-verify; mark each verification step done

### Phase 6 — Handoff & Documentation
- [ ] Write README (run, dev, test, deploy instructions)
- [ ] Summarize what was built and known limitations in build.md
- [ ] Final sign-off with the user

## build.md template

On first run, create `build.md` with this structure (fill sections as you go):

```markdown
# Build Log: <Project Name>

> Status: Phase 0 — Discovery
> Last updated: <date>

## 1. Project Description
<2-5 sentences derived from user clarifications>

### Clarifications & Decisions
- **Q:** <question>  **A:** <answer>  *(decision)*
- **Q:** <question>  **A:** <answer>  *(decision)*

## 2. Tech Stack
| Layer        | Choice | Reasoning | Alternatives considered |
|--------------|--------|-----------|--------------------------|
| Language     |        |           |                          |
| Framework    |        |           |                          |
| Runtime      |        |           |                          |
| Database     |        |           |                          |
| Infra/Deploy |        |           |                          |
| Testing      |        |           |                          |

## 3. Skills & Tooling Inventory
| Tool / Skill / MCP | Purpose        | Install Status | Working Status | Proof / Notes |
|--------------------|-----------------|----------------|----------------|---------------|
| node               | JS runtime      | installed      | verified       | `node -v` -> v20.x |
| <skill>            | <why needed>    | not installed  | unknown        | needs install |

## 4. Progress

### Phase 0 — Discovery & Clarification
- [ ] Ask clarifying questions
- [ ] Write Project Description
- [ ] Capture Q&A decisions
- [ ] Confirm scope with user

### Phase 1 — Tech Stack Selection
- [ ] Propose stack
- [ ] Record reasoning & alternatives
- [ ] Confirm with user
- [ ] Document final stack

### Phase 2 — Skills & Tooling Inventory
- [ ] List required tools/skills
- [ ] Check install status
- [ ] Verify working status
- [ ] Install/flag missing & re-verify

### Phase 3 — Scaffolding
- [ ] Init project & structure
- [ ] Apply base config
- [ ] Minimal runnable entrypoint
- [ ] Confirm builds/runs

### Phase 4 — Implementation
- [ ] Feature breakdown
- [ ] Implement feature set
- [ ] Update progress per feature
- [ ] Milestone review

### Phase 5 — Verification
- [ ] Tests / types / lint
- [ ] Manual core-flow check
- [ ] Fix & re-verify

### Phase 6 — Handoff & Documentation
- [ ] README
- [ ] Summary & limitations
- [ ] Final sign-off
```

## How to operate each session
- At startup, if `build.md` exists, **read it first** and resume from the
  incomplete step. If not, begin Phase 0.
- Keep the `Status:` line and `Last updated:` date current.
- When a phase's steps are all `[x]`, ask the user to sign off before the next.
- Be concise in chat; the detail lives in build.md.

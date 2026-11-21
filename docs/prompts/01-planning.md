# Phase 01 — Planning and Requirements

**Tool:** Claude (chat) · **Goal:** understand the brief, choose the stack and hosting, set the scope, and produce the requirements, architecture and decision records before writing any code.

Key prompts from the session.

| #   | Prompt                                         | Produced                                                         |
| --- | ---------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Analyse the brief                              | Problem summary, deliverables checklist, list of open decisions  |
| 2   | Choose the stack and hosting                   | ADR-1 to ADR-3, hosting choice                                   |
| 3   | Set the scope and write the requirements       | [requirements.md](../requirements.md), ADR-7                     |
| 4   | Assess free-tier performance risk              | 1,000-row import limit, import write strategy                      |
| 5   | Set up the documentation and agent conventions | README, architecture, ADRs, `CLAUDE.md`, responsive layout table |

---

### 1. Analyse the brief

**Intent:** Understand the problem fully before any solution is proposed.

> Before we design anything, analyse the brief. Give me:
>
> 1. The problem in two or three sentences, framed from the HR Manager's point of view.
> 2. Every deliverable the brief asks for, as a checklist.
> 3. What reviewers are likely to evaluate, beyond working code.
> 4. The open decisions we need to make before implementation, in the order they block each other.
>
> Don't propose a stack or start on code yet.

**Outcome:** The product was summarised as salary CRUD plus pay insights for one persona, the HR Manager. Deliverables: requirements document, backend, UI, a 10,000-employee seed, deployment, demo video and tests. Evaluation criteria: incremental commits, AI artifacts, and judgment over complexity. The open decisions, in order, were stack, scope, hosting and repository workflow.

---

### 2. Choose the stack and hosting

**Intent:** Settle the stack and hosting with the trade-offs made explicit, and record the reasoning behind the database choice.

> The stack is TypeScript end to end: NestJS + TypeORM for the API, PostgreSQL on Supabase (free plan) for the database, and React with MUI for the UI. Backend and frontend must both be hosted on free tiers.
>
> 1. Map Supabase against the requirements: relational data, a persistent deployment, 10,000 rows, aggregations including median, and a test suite that doesn't depend on the hosted database. Document the alternatives considered (SQLite, Neon, Railway Postgres) and why each was not chosen.
> 2. Recommend free hosting for the NestJS API and the static React build. Check the current free-tier terms rather than relying on training data, and point out any limits (CPU, memory, sleep behaviour) that should shape the design.
> 3. List the implementation consequences of these choices that we have to plan for now.
>
> Record each decision as an ADR: context, decision, alternatives considered, consequences.

**Outcome:** Supabase met every requirement. In the alternatives analysis, SQLite was ruled out because free hosts typically have ephemeral file systems, and Neon was found equally suitable. Hosting: Render for the API, Vercel for the frontend, both checked against the 2026 free-tier terms. The AI also flagged three things to plan for:

- connect through Supabase's session pooler, because the free hosts are IPv4-only
- use TypeORM migrations, never `synchronize`
- keep unit tests independent of the hosted database

It proposed Vite as the build tool, and MUI for its server-side DataGrid. It also flagged the Render free instance (0.1 vCPU, 512 MB) as the main constraint for later prompts. Recorded as ADR-1, ADR-2 and ADR-3.

**Human decision:** Supabase over Neon, for its dashboard and SQL editor. It is used purely as a managed Postgres database; Supabase Auth and the auto-generated APIs are deliberately not used.

---

### 3. Set the scope and write the requirements

**Intent:** Turn the brief into a one-page scope document that justifies what is left out, and decide on Excel import/export.

> Write `docs/requirements.md`: goal, persona and the key questions the product must answer, features in scope, features deliberately left out (each with a reason), non-functional requirements with measurable targets, and success criteria. Keep it to one page.
>
> One change to your initial proposal: bring Excel import and export into scope. HR's data lives in spreadsheets today, so import is how they will move their data in. Define the rules precisely: file format, how rows are matched to existing employees, validation behaviour, what happens on a partial failure, limits, and whether import can ever delete records.
>
> Excel will be the most complex feature, so contain the risk. Schedule it last in the build order, keep it to the narrow rules above, and treat export plus the template as the fallback if time runs short. Record the decision and its trade-offs as an ADR.

**Outcome:** One-page [requirements.md](../requirements.md). The Excel rules:

- downloadable template; .xlsx only
- rows matched to existing employees by email (upsert)
- every row validated before any write, then one all-or-nothing transaction
- row-level error report (row, column, reason) when any row fails
- export respects the current search and filters
- import never deletes records

The build order puts Excel last, with export plus template as the fallback. Recorded as ADR-7.

**Human decision:** The AI's initial scope left Excel import/export out. I brought it into scope because the brief names spreadsheets as HR's pain point, which makes import the realistic way to migrate their data. That makes it product thinking rather than gold-plating. To keep the risk contained, I limited it to narrow, all-or-nothing rules and scheduled it last.

---

### 4. Assess free-tier performance risk

**Intent:** Make sure the most expensive feature still performs well on a 0.1 vCPU instance.

> The Excel import will run on Render's free instance (0.1 vCPU, 512 MB). Identify where a large import would be slow or run out of memory: parsing, validation, database round trips, and network latency to Supabase. Propose specific mitigations.
>
> Change the import limit from the proposed 10,000 rows / 5 MB to 1,000 rows / 1 MB per file. Import is for routine batches like new joiners and salary revisions; the initial 10,000 employees come from the seed script. Update the requirements, the architecture and ADR-7 consistently, and show how the write path changes at this size.

**Outcome:** Mitigations:

- stream file parsing
- validate all rows in one pass in memory
- write the whole file with a single multi-row `ON CONFLICT` upsert in one transaction
- measure on the deployed instance as soon as the endpoint works

The limit became 1,000 rows / 1 MB, so a full file costs one database round trip and well under the 5 s target. The requirements, the architecture (import sequence diagram and performance table) and ADR-7 were updated in the same commit.

**Human decision:** Reduced the AI's proposed 10,000-row / 5 MB limit to 1,000 rows / 1 MB. Bulk loading is a one-off migration handled by the seed script, and the smaller cap keeps imports fast and predictable on the free instance.

---

### 5. Set up the documentation and agent conventions

**Intent:** Make the repository reviewable before any code exists, and give the coding agent standing instructions so every session follows the same standards, including a responsive UI.

> Set up the documentation a reviewer will read first:
>
> - `README.md`: overview, stack, setup, and links to the docs.
> - `docs/architecture.md`: system diagram, repository layout, backend layering, data model, API table, import sequence diagram, performance and testing strategy. Use Mermaid for the diagrams.
> - `docs/decisions.md`: ADRs for every significant decision so far.
> - `docs/ai-workflow.md` and `docs/prompts/`: how AI is used, where its output was overridden, and a log of the key prompts for each phase.
> - `CLAUDE.md`: standing instructions for the coding agent: plan first, small test-backed increments, code and testing standards, Conventional Commits, and the duty to update the docs in the same commit as the code.
>
> The UI must also be fully responsive. HR will open it on phones, tablets and desktops. Add this as a non-functional requirement (360 px and up), add a layout table to the architecture showing how each screen adapts at 360, 768 and 1280 px, and add mobile-first UI standards to `CLAUDE.md`.

**Outcome:** The full documentation set was committed before any application code. The architecture's responsive layout table specifies, among other things, that the directory switches from a data grid to a card list on phones, because a 10-column grid is unusable at 360 px. `CLAUDE.md` now requires MUI breakpoints, no fixed pixel layout widths, touch targets of at least 44 px and no hover-only interactions, so every later screen is built to the same standard.

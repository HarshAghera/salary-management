# Architecture Decision Records

Short records of significant decisions: the context, what was decided, and the trade-offs accepted. New decisions are appended; superseded ones are marked, not deleted.

---

## ADR-1: NestJS + TypeORM for the backend
**Status:** Accepted

**Context:** The role is TypeScript-focused. The backend needs validation, modular structure and testability for a CRUD + reporting API.

**Decision:** NestJS with TypeORM.

**Consequences:**
- ➕ Opinionated module/controller/service structure keeps features consistent and easy to navigate.
- ➕ Dependency injection makes services straightforward to unit test with mocked repositories.
- ➕ TypeORM migrations give a versioned, reviewable schema history.
- ➖ More framework ceremony than Express for a small API. Accepted for the structure it brings.

---

## ADR-2: PostgreSQL on Supabase
**Status:** Accepted

**Context:** The brief asks for a relational database. The app must be deployed, and data must persist across deploys.

**Decision:** Managed PostgreSQL on Supabase, used purely as a database (Supabase Auth and auto-generated APIs are not used).

**Alternatives considered:**
- *SQLite* — simplest locally, but free hosts commonly use ephemeral file systems, so data would not survive redeploys.
- *Neon* — equally suitable; Supabase chosen for its dashboard and SQL editor.

**Consequences:**
- ➕ Real Postgres: `percentile_cont` for medians, partial/functional indexes, `ON CONFLICT` upserts.
- ➕ No database operations to manage.
- ➖ Connection must go through Supabase's session pooler for IPv4 hosts.

---

## ADR-3: React (Vite) + MUI for the frontend
**Status:** Accepted

**Decision:** React with Vite, MUI as the component library, TanStack Query for server state.

**Consequences:**
- ➕ MUI DataGrid supports server-side pagination, sorting and filtering out of the box — essential for 10,000 rows.
- ➕ Accessible, consistent components without custom design work.
- ➖ Larger bundle than a headless library. Acceptable for an internal HR tool.

---

## ADR-4: Server-side pagination, filtering and sorting
**Status:** Accepted

**Context:** 10,000 employees is too many to ship to the browser and filter client-side.

**Decision:** The API owns paging, filtering and sorting. Sort fields are whitelisted.

**Consequences:**
- ➕ Constant payload size regardless of headcount; scales well past 10,000.
- ➕ Whitelisting prevents arbitrary column injection into `ORDER BY`.
- ➖ Every interaction is a round trip. Mitigated by query caching on the client.

---

## ADR-5: Compute insights in SQL
**Status:** Accepted

**Context:** Insights (min, max, average, median per country and job title) could be computed in Node after loading rows, or in the database.

**Decision:** Aggregate in PostgreSQL with `GROUP BY`; median via `percentile_cont(0.5) WITHIN GROUP (ORDER BY salary)`.

**Consequences:**
- ➕ One small result set over the wire instead of 10,000 rows.
- ➕ The database is built for this and uses indexes.
- ➖ Aggregation logic lives in SQL; covered by integration tests rather than pure unit tests. Result mapping and formatting remain unit tested.

---

## ADR-6: Store salary as `numeric`, derive currency from country
**Status:** Accepted

**Decision:** `salary` is `numeric(12,2)`; `currency` is derived server-side from `country_code` via a reference map and is never accepted from the client.

**Consequences:**
- ➕ Decimal amounts (e.g. 85,000.50) are supported and stored exactly, so sums and averages have no floating-point rounding errors (`float`/`double` would turn 0.1 + 0.2 into 0.30000000000000004).
- ➕ Country and currency can never disagree.
- ➖ Postgres returns `numeric` as a string; a TypeORM column transformer converts it explicitly.
- ➖ Assumes one currency per country — true for the countries in scope.

---

## ADR-7: All-or-nothing Excel import, upsert by email
**Status:** Accepted

**Context:** HR's data lives in spreadsheets. Imports must be safe to re-run and must never leave data half-applied.

**Decision:** Validate every row before writing. If any row fails, reject the file with a row-level error report. Otherwise apply all rows in one transaction, upserting by case-insensitive email. Import never deletes.

**Alternatives considered:**
- *Partial import (apply valid rows, report the rest)* — faster feedback, but leaves HR reconciling which rows landed.
- *Delete rows missing from the file* — makes a stale spreadsheet dangerous.

**Consequences:**
- ➕ Predictable outcome; re-uploading the same file is idempotent.
- ➕ Email is a natural, human-meaningful key HR already has.
- ➖ One bad row blocks the whole file. Mitigated by a clear error report and a downloadable template.
- ➖ Files are capped at 1,000 rows. Routine HR changes are far smaller than this, and the cap keeps imports fast and predictable on a small instance (0.1 vCPU). Bulk loading the whole organization is a one-off migration handled by the seed script.

---

## ADR-8: Deterministic seed data
**Status:** Accepted

**Decision:** The seed script generates 10,000 employees with a fixed random seed, realistic salary bands per country and job title, and inserts in batches.

**Consequences:**
- ➕ Every environment has identical data, so insights, screenshots and the demo are reproducible.
- ➕ Salary bands make the insights meaningful rather than random noise.

---

## ADR-9: Excel export mirrors the import template
**Status:** Accepted

**Context:** HR's day-to-day work happens in spreadsheets. If an export cannot be imported back, every bulk change means retyping data into the template.

**Decision:** Export uses the import template's columns plus a read-only `Currency` column. Import matches columns by header name, ignores unknown columns, and validates rows with the same DTO as the API. Files are read and written with `exceljs`.

**Alternatives considered:**
- *Fixed column positions* — simpler parsing, but a reordered or extra column would silently shift data into the wrong field.
- *A separate import-only validator* — duplicates the API's rules, so the two would drift apart.
- *SheetJS* — capable, but current releases are distributed outside the npm registry. `exceljs` is on npm, supports streaming writes and data validation (the country dropdown).

**Consequences:**
- ➕ Export → edit → import works with no reformatting; re-importing an unchanged export is idempotent.
- ➕ One set of validation rules for the API and the import, with error messages that name the spreadsheet column.
- ➖ Matching by header means renamed headers are reported as missing columns. Mitigated by the template and a clear error on row 1.
- ➖ The created/updated split relies on Postgres's `xmax = 0` for freshly inserted rows, a widely used but implementation-level detail. If it changed, only the counts in the response would be affected, not the data.

---

## ADR-10: Deploy the API as a Render Blueprint, migrating on start
**Status:** Accepted

**Context:** The API runs on Render's free plan, which has no pre-deploy step for running migrations and puts the instance to sleep after 15 minutes without traffic. Every request makes one to three database round trips, so the distance between API and database is added to every response.

**Decision:** The service is described in `render.yaml` (infrastructure as code) and runs in Render's Singapore region, with the Supabase database in the same region (`ap-southeast-1`). The start command runs pending migrations from the compiled build, then starts the API. `/health` checks database connectivity and is Render's health check, so a deploy that cannot reach the database is never put into service.

**Alternatives considered:**
- *Run migrations automatically inside the app (`migrationsRun`)* — hides schema changes in application startup; an explicit command is easier to see and to run by hand.
- *Run migrations manually before each deploy* — easy to forget, and the API could start against an outdated schema.

**Consequences:**
- ➕ The deployment is reproducible from the repository; secrets stay in Render's dashboard.
- ➕ A deploy always runs against the current schema, and a broken database connection fails the health check instead of serving errors.
- ➕ Co-location was measured, not assumed. With the database in Sydney, a trivial `/health` request took a median of 312 ms and the slowest endpoint 369 ms, almost all of it network between the two regions. After moving the database to Singapore (a new project, rebuilt with the scripted migration and the deterministic seed in seconds), the same requests took 126–185 ms end to end from a client in India.
- ➖ Migrations run on every start. They are idempotent, so this costs one quick query when there is nothing to apply. It would need revisiting with several instances, which the free plan does not use.
- ➖ The first request after a period of inactivity waits for the instance to wake up (typically under a minute). Acceptable for an internal tool and its demo; a paid instance removes it.

---

## ADR-11: A calm, data-first visual design with light and dark modes
**Status:** Accepted

**Context:** HR spends long sessions reading tables and figures. MUI's defaults (heavy shadows, saturated blue bars, Roboto) look dated and compete with the data.

**Decision:** A "Teal & mint" palette. The brand colour, teal `#0F766E`, is identical in both modes: it fills the top bar and the logo mark, so light and dark read as one product. Light mode has white cards on a mint-tinted canvas (`#F2F8F7`). Dark mode tints the canvas (`#11211F`) and cards (`#183330`) with the same teal, so a mostly empty screen reads as one colour family rather than a large near-black area. Text is a tinted ink (`#10231F` / `#E8F5F2`), never pure black on white. Teal is also the primary accent for buttons and links; in dark mode it is lifted to `#2DD4BF`, the same hue, so it stays legible on dark cards. There is one secondary accent (periwinkle). Status colours are reserved for meaning: green for success, amber for warning, red for error, sky for info, used the same way in badges, import results and charts. Success is a leaf green (`#15803D`), kept clearly apart from the blue-green brand so a success message never looks like an ordinary button. The brand colour fills a solid top bar: on desktop it holds the section tabs, with the active one underlined; on phones and tablets it holds a menu button that opens a drawer. Cards have 12–16 px radii, a soft primary-tinted shadow in light mode and a hairline border in dark mode. Type is Poppins (weights 400–700), bundled with the app rather than loaded from a font CDN. The colour scheme follows the device setting, can be switched in the app, and is applied by an inline script before the app loads, so dark mode never flashes white.

**Alternatives considered:**
- *Periwinkle brand with an untinted slate dark mode* — modern, but dark mode reads as a large near-black area.
- *Emerald brand* — fresh, but the same family as the success green, so success badges blend in with buttons.
- *Deep forest green* — calm, but less lively for an everyday tool.

**Consequences:**
- ➕ Data stays the most prominent element; colour carries meaning instead of decoration.
- ➕ Both schemes come from one theme definition, so every component and later screen inherits them.
- ➕ Navigation across the top leaves the full page width for the employee table.
- ➖ Every new colour must fit the palette rules; status colours must not be reused as decoration.
- ➖ White text on the top bar limits how light the brand can be: `#0F766E` gives 5.5:1 contrast, so paler teals are not used for the bar.
- ➖ The bundled font adds about 31 KB on first load (four weights of the Latin subset; other scripts load only if a page uses them), in exchange for consistent typography and no third-party request.

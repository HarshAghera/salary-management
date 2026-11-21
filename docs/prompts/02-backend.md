# Phase 02 — Backend

**Tool:** Claude Code (agentic, in the repository) · **Goal:** build the NestJS API feature by feature (employee management, directory, seed data, salary insights, Excel import and export), with tests written first and every increment verified against the real database before it is committed.

Key prompts from the session.

| # | Prompt | Produced |
|---|---|---|
| 1 | Set up the backend foundation and data model | Workspace, CI, validated config, `Employee` entity, first migration |
| 2 | Build employee management | CRUD endpoints, validation rules, 409/404 handling |
| 3 | Build the employee directory | Paged list with search, filters and whitelisted sorting |
| 4 | Add filter options, seed data and salary insights | `filter-options`, deterministic 10,000-employee seed, three insight endpoints |
| 5 | Add Excel import and export | Template, all-or-nothing import, filtered export, ADR-9 |
| 6 | Audit the backend against the brief and close the gaps | Requirements audit, 20 integration tests against PostgreSQL, CI database service |

---

### 1. Set up the backend foundation and data model

**Intent:** Establish a backend that fails fast on bad configuration, keeps the schema under version control, and stores money exactly.

> Set up the NestJS API as the first npm workspace, following `CLAUDE.md` and the architecture:
> - Strict TypeScript, Jest, and a CI workflow that runs typecheck, tests and build on every push.
> - Validate environment variables at startup so a missing `DATABASE_URL` or an invalid `PORT` stops the app with a clear message. Connect to Supabase through the session pooler.
> - One TypeORM data source shared by the app and the migration CLI, with `synchronize` off.
>
> Then add the `Employee` entity and the first migration. Salary is the annual gross amount and must support decimals: store it as `numeric(12,2)` so values like 85,000.50 are exact, with a database check that it is positive. Currency is derived from the country on the server, never accepted from the client. Add the indexes the directory and insights need.
>
> Every commit must build and pass its tests on its own. Write the tests before the code.

**Outcome:** Workspace, CI and startup validation, with tests for each configuration rule. The migration creates the table with a positive-salary check, a unique index on `lower(email)`, and indexes on country, department and `(country, job_title)`. A column transformer converts Postgres's text representation of `numeric` into numbers, with tests for decimals, the largest allowed salary and nulls. The data source only registers the entity in the commit that creates it, so each commit compiles independently. The migration was run against Supabase before committing.

**Human decision:** Salaries support two decimal places and are stored exactly as `numeric`, never as binary floating point, so sums and averages cannot drift. The requirements, ADR-6 and `CLAUDE.md` were reworded to state decimal support explicitly, so "never floating point" cannot be read as "whole numbers only".

---

### 2. Build employee management

**Intent:** Give HR safe create, view, update and delete operations with validation that a non-technical user can understand.

> Add create, view, update and delete endpoints for employees, layered controller → service → repository as `CLAUDE.md` requires.
> - Validate every field with DTOs: trim text, lower-case emails, upper-case country codes, salary positive with at most two decimals, hire date a real `YYYY-MM-DD` date. Updates accept any subset of fields.
> - Emails are unique regardless of letter case: return 409 on a duplicate, including the race where two requests insert at once. Return 404 for unknown ids.
> - Recompute the currency whenever the country changes. Reject any client-supplied currency.
>
> Cover the business rules with service tests against a mocked repository, then verify each endpoint against the running API and the real database.

**Outcome:** Four endpoints with DTO validation and 27 tests, including an explicit test that a two-decimal salary is accepted. The service checks email availability up front, and the database's unique index backs it up, with Postgres error `23505` mapped to 409. A manual run against Supabase confirmed currency derivation, case-insensitive email handling, 409 on duplicates, currency changing with the country, a full list of validation errors for bad input (including `property currency should not exist`), and 204 then 404 on delete.

**Human decision:** Every endpoint is verified against the real database before it is committed, not only through unit tests, and the README's project status is kept current in the same commit as the feature.

---

### 3. Build the employee directory

**Intent:** Let HR find any of 10,000 employees in seconds without the browser ever holding the full list.

> Add `GET /employees` as the directory (ADR-4):
> - Paging with `page` and `pageSize` (default 25, maximum 100), returning the page together with the total count.
> - Case-insensitive search across name and email. `%` and `_` typed by the user must match literally.
> - Filters for country, department and job title.
> - Sorting by name, salary or hire date only. Client input selects a whitelisted key and never reaches `ORDER BY` directly. Pages must stay stable when sort values tie.
>
> Write the tests first and confirm they fail. Move the shared text-normalisation helpers into `common/` so both DTOs use them, and document the response shape in the architecture.

**Outcome:** A query DTO with defaults and limits, pure helpers for the sort whitelist and LIKE escaping, and a single repository query that orders by the chosen field and then by `id`, fetching the page and the count together. Sixteen new tests. Checked against four real employees: every sort, paging, combined filters, case-insensitive search, a literal `50%` search, a lone `%` that does not match everyone, and 400 for an unknown sort field, an oversized page, an unknown country, page 0 and an unknown parameter.

**Human decision:** The README status list stays short, at about six grouped lines, and a line is ticked only when everything in it is done.

---

### 4. Add filter options, seed data and salary insights

**Intent:** Complete the data side of the product: realistic data at full scale, and the numbers that answer HR's three key questions.

> Build these three as one module and one commit:
> 1. `GET /employees/filter-options`: the reference countries (the create form needs all of them) plus the departments and job titles in use.
> 2. A seed script for 10,000 employees (ADR-8): deterministic with a fixed seed, countries weighted by size, salary bands per country and job title so the insights are meaningful, batched inserts in one transaction, and a guard that refuses to overwrite existing data without `--reset`.
> 3. Insights (ADR-5): an overview with headcount by country and department; per-country headcount, min, max, average and median; and a per-job-title breakdown within a country. Compute every aggregate in SQL and never combine salaries across currencies.
>
> Test the generator and the result mapping without a database. Then seed Supabase, check the figures, and measure query times against the 300 ms target.

**Outcome:** A seeded random generator (mulberry32) and a pure employee generator with 16 tests: identical output for the same seed, unique emails, every salary inside its band, real hire dates and every country present. The seed loaded 10,000 employees in about 12 seconds, and a second run refused with exit code 1. Insights use single `GROUP BY` queries with `percentile_cont` for the median, rounded to cents in SQL; seven tests cover the mapping and the country-code check. Country headcounts summed to exactly 10,000. Measurement showed that Postgres executes each insight and directory query in 0.4–23 ms, while a single network round trip from a laptop to Supabase takes about 300 ms. Both figures are recorded in the architecture.

**Human decision:** Related features ship as one reviewed module and commit rather than many small ones, keeping the history readable while every commit still builds and passes its tests.

---

### 5. Add Excel import and export

**Intent:** Bridge HR's existing spreadsheets into the product safely, and let data flow back out (ADR-7).

> Add the Excel features as one module:
> - `GET /excel/template`: the import columns, a country dropdown and an instructions sheet.
> - `POST /excel/import`: `.xlsx` only, 1 MB and 1,000 rows at most. Match columns by header name in any order. Validate every row with the same rules as the API, and reject an email that appears twice in the file. If any row is invalid, save nothing and return 422 with the row, column and reason for each problem, in terms HR understands. Otherwise write every row in one atomic upsert keyed on `lower(email)` and report how many employees were created and how many updated. Import never deletes.
> - `GET /excel/export`: the directory's search, filters and sort without paging, streamed, using the template's columns plus currency so an export can be edited and imported back.
>
> Turn the spreadsheet into plain rows before parsing, so the parser is tested without files or a database. Verify with real files: invalid rows, a mixed new-and-existing file, re-importing the same file, the 1,000-row maximum, every rejection path, and an export → import round trip. Record the design as an ADR.

**Outcome:** A pure import parser with 17 tests (column matching, Excel cell types such as hyperlinks, rich text, formulas and dates, salaries typed as text, duplicate emails, limits) and 8 service tests using real in-memory workbooks. The write is a single `INSERT … ON CONFLICT ((lower(email))) DO UPDATE … RETURNING (xmax = 0)`, so created and updated rows are counted in the same statement. Verified against Supabase:
- an invalid file returned 422 and saved nothing, not even its valid row
- an existing employee was matched despite an upper-case email
- re-importing the same file was idempotent
- 1,000 rows imported in 1.8 seconds
- the 1,001-row, wrong-type, unreadable, oversized (413) and missing-file cases were each rejected with a clear message
- a 309-row export re-imported as 0 created and 309 updated

The database was then reset to the deterministic seed. Recorded as ADR-9.

**Human decision:** Export mirrors the import template, so HR can export, edit and import the same file. Validation messages are phrased in the spreadsheet's column names ("Hire date must be a real calendar date") rather than library defaults.

---

### 6. Audit the backend against the brief and close the gaps

**Intent:** Before deploying, confirm that every backend requirement in the brief, the requirements document and our own ADRs is met, and back the SQL with real tests rather than manual checks.

> Check the backend against the original assessment brief, `docs/requirements.md`, the architecture and the ADRs. List what is covered and what is missing, with where each gap is promised.
>
> Then close the testing gap. ADR-5 says the SQL aggregation is covered by integration tests, so add them in `backend/test/`: run the real services and repositories against PostgreSQL, rebuild the schema from the migrations on each run, and cover the insight figures (including median rounding), directory filters, search escaping and stable paging, the import upsert, the export round trip, and the database's own unique and check constraints. Unit tests must stay database-free. The suite must be impossible to run against a real database by accident, and must not depend on any one tool for providing Postgres. Run it in CI on every push.

**Outcome:** The audit found every functional requirement implemented and verified. The remaining gaps were deployment, the health check, end-to-end latency (which needs a deployed API), integration tests and linting. The integration suite has 20 tests in four files and runs through the same services the API uses. It refuses any database whose name does not end in `_test`. The CLI data source was moved to its own module, so tests can import the shared configuration without reading the app's environment. CI now starts a throwaway Postgres 16 service and runs the suite on every push. All 20 tests passed locally against a separate `salary_test` database in the project's Supabase instance, and the main database was confirmed untouched (still 10,000 employees).

**Human decision:** The integration tests must not require Docker. Any PostgreSQL works: CI provides its own, and locally a separate `_test` database in the existing Supabase project, a local install, or a container are all documented options. The live data is never used for tests.

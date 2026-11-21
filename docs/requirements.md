# Salary Management — Requirements

## Goal
ACME's HR team manages salary data for 10,000 employees across several countries in Excel. That is slow, error-prone and makes it hard to answer basic questions about pay. This product gives the **HR Manager** a web app to (1) maintain employee salary records and (2) answer questions about how the organization pays people.

## User & key questions
**Persona:** HR Manager — comfortable with spreadsheets, not technical. Needs speed and trustworthy numbers.

Questions the product must answer:
1. What is the min / max / average / median salary in a given country?
2. What does a given job title earn on average in a given country?
3. How many people do we employ per country and per department?

## In scope
**Employee management**
- Create, view, edit and delete an employee.
- Fields: full name, email (unique), job title, department, country, salary (annual, gross), currency (derived from country), hire date.
- Server-side validation (required fields, positive salary, valid email, known country).

**Employee directory**
- Paginated list (server-side) that stays fast at 10,000+ rows.
- Search by name or email; filter by country, department, job title; sort by name, salary, hire date.

**Salary insights**
- Per-country summary: headcount, min, max, average, median salary (local currency).
- Per-job-title breakdown within a selected country: headcount, average, min, max.
- Org overview: total headcount, headcount by country and by department.

**Excel import / export** (the bridge from today's spreadsheets)
- Download a blank import template (.xlsx) with the expected columns.
- Import an .xlsx file: rows are matched by email — new emails are created, existing ones are updated.
- Every row is validated before anything is saved. If any row is invalid, nothing is imported and HR gets a row-by-row error report (row number, column, reason) to fix and re-upload. All-or-nothing keeps the data consistent and avoids half-applied files.
- Import summary on success: rows created, rows updated.
- Export the employee directory to .xlsx, respecting the current search and filters.
- Limits: .xlsx only, up to 1,000 rows / 1 MB per file. Import is for routine batches of changes (new joiners, salary revisions), not for loading the whole organization; the initial 10,000 employees are loaded by the seed script.

**Data & operations**
- Seed script that creates 10,000 realistic employees, deterministic (fixed random seed) so every run produces the same data.
- Versioned database migrations.
- Deployed backend, frontend and database, plus a short video demo.

## Deliberately out of scope
| Left out | Why |
|---|---|
| Authentication & roles | Single persona (HR Manager); adds setup cost without showing anything about the core problem. Would be first on the roadmap. |
| Currency conversion / org-wide pay comparisons | Requires FX rates and a policy decision (which rate, which date). Comparing *within* a country is accurate and answers the stated questions. |
| Salary history & audit trail | Valuable, but doubles the data model. Current salary is enough to answer "how do we pay people" today. |
| CSV import, partial imports, deleting via import | One well-defined format and one predictable outcome (all or nothing). Deletion stays an explicit action in the UI so a stale spreadsheet can never wipe records. |
| Payroll, bonuses, benefits, tax | A different product (payroll), not salary management. |
| Charts beyond simple tables/bars | Clear numbers matter more than visual polish for a first version. |

## Non-functional requirements
- **Performance:** list and insight endpoints respond in < 300 ms at 10,000 employees; a 1,000-row import completes in under 5 s (indexes on country, job title, department; aggregates computed in SQL, not in application code).
- **Responsive UI:** fully usable on phones, tablets and desktops (from 360 px wide upwards). Every feature works on every screen size; layouts adapt rather than shrink.
- **Correctness:** salaries support decimal amounts (up to 2 places, e.g. 85,000.50) and are stored exactly as `numeric`, never as binary floating point, so totals and averages don't drift.
- **Quality:** unit tests for business logic (validation, import row parsing, insight calculations, query building) that are fast and deterministic, with no network or real database.
- **Maintainability:** layered backend (controller → service → repository), typed API contracts shared in intent between backend and frontend.

## Success criteria
An HR Manager can move existing spreadsheet data in, find any employee in seconds, update a salary, answer the three key questions above, and export data back to Excel when needed.

*Stack: NestJS + TypeORM · PostgreSQL (Supabase) · React (Vite) + MUI.*

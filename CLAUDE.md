# Instructions for AI Coding Agents

These are the standing instructions for any AI agent working in this repository. Read them at the start of every session.

## Project
Salary management web app for ACME's HR Manager (10,000 employees, multiple countries).
- Requirements: `docs/requirements.md` — the source of truth for scope. Do not add features outside it without asking.
- Architecture: `docs/architecture.md` · Decisions: `docs/decisions.md`

## Stack
- `backend/` — NestJS, TypeORM, PostgreSQL. Jest for tests.
- `frontend/` — React (Vite), MUI, TanStack Query. Vitest + React Testing Library.

## How to work
1. **Plan first.** For any non-trivial change, state the approach and the tests you'll write before writing code.
2. **Small increments.** One concern per change. Each increment ends with tests, lint and typecheck passing.
3. **Test-first where practical.** Write or update the test, see it fail, then implement.
4. **Ask, don't assume.** If a requirement is ambiguous, ask rather than guess.

## Code standards
- TypeScript `strict` mode. No `any` unless justified in a comment.
- Backend layering: controller (HTTP + DTOs) → service (business rules) → repository (persistence). Controllers stay thin.
- Validate all input with `class-validator` DTOs; the global `ValidationPipe` uses `whitelist` and `forbidNonWhitelisted`.
- Money is `numeric(12,2)` in the database: decimal amounts are supported and stored exactly. Never use binary floating point (`float`/`double`) to store or aggregate money; aggregate in SQL. Currency is derived from country server-side.
- Aggregations run in SQL. Sort fields are whitelisted.
- Schema changes only through TypeORM migrations. Never enable `synchronize`.
- Configuration through environment variables, validated at startup. Never commit secrets; keep `.env.example` up to date.
- Names describe intent. Comments explain *why*, not *what*.

## UI standards
- Mobile-first and responsive: every screen must work at 360 px, 768 px and 1280 px widths. Use MUI breakpoints (`useMediaQuery`, responsive `sx` values, `Grid`) — no fixed pixel widths for layout.
- Follow the responsive layout table in `docs/architecture.md`.
- Touch targets ≥ 44 px; no hover-only interactions. Use semantic, accessible MUI components with labels.

## Testing standards
- Unit tests must be fast and deterministic: no network, no real database, no wall-clock dependence, fixed seeds for random data.
- Mock repositories in service tests. One behaviour per test, named as a sentence: `it('rejects a negative salary')`.
- Arrange–Act–Assert structure. Each test sets up its own data.
- SQL behaviour (aggregates, filters, upserts, constraints) is covered by integration tests in `backend/test/*.int-spec.ts`, run against a `_test` PostgreSQL database. Add or update one whenever a query or migration changes.

## Commits
- Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, with an optional scope, e.g. `feat(employees): add directory pagination`.
- Small and focused; the message says what changed and, in the body when useful, why.
- Never commit failing tests, `.env` files or generated build output.

## Documentation duties
Keep the documentation in step with the code, in the same commit as the change it describes:
- New or changed endpoint → update the API table in `docs/architecture.md`.
- Significant design choice or trade-off → append an ADR to `docs/decisions.md`.
- At the end of each phase → add the key prompts to `docs/prompts/` (intent, prompt, outcome, human decision) and update the "corrected or overridden" table in `docs/ai-workflow.md`.
- Keep `README.md` setup instructions accurate.
- Write all documentation in a clear, professional tone.

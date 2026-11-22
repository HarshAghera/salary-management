# Salary Management

A web application that lets ACME's HR Manager manage salary data for 10,000 employees across multiple countries, and answer questions about how the organization pays people, without spreadsheets.

|                |                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Live app**   | [salary-management-pink.vercel.app](https://salary-management-pink.vercel.app)                                                                                             |
| **API**        | [salary-management-api-fw2q.onrender.com](https://salary-management-api-fw2q.onrender.com/health) (free instance: the first request after a pause can take up to a minute) |
| **Video demo** | [Watch Here](https://www.youtube.com/watch?v=hVcHOlwjDmA) (3 min)                                                                                                          |

## Features

- **Employee directory**: server-side paginated list of 10,000+ employees with search, filters (country, department, job title) and sorting.
- **Employee management**: create, view, edit and delete employees with full validation.
- **Salary insights**: per-country min, max, average and median salary; per-job-title breakdown within a country; headcount by country and department.
- **Excel import / export**: template download, validated all-or-nothing import with row-level error reports, and filtered export.

## Tech stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React (Vite), MUI, TanStack Query, React Router |
| Backend  | NestJS, TypeORM                                 |
| Database | PostgreSQL (Supabase)                           |
| Testing  | Jest, Vitest, React Testing Library             |
| Hosting  | Vercel (frontend), Render (backend)             |

## Documentation

| Document                              | Contents                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------- |
| [Requirements](docs/requirements.md)  | Goal, scope, deliberate exclusions and reasoning                          |
| [Architecture](docs/architecture.md)  | System and data model diagrams, API, performance and testing strategy     |
| [Decision records](docs/decisions.md) | Key decisions, alternatives considered and trade-offs                     |
| [AI workflow](docs/ai-workflow.md)    | How AI tools were used and verified, with the [prompt log](docs/prompts/) |
| [Agent instructions](CLAUDE.md)       | Standing conventions given to the AI coding agent                         |

## Getting started

This is an npm-workspaces monorepo: `backend/` (NestJS API), `frontend/` (React SPA) and `docs/`. Requires Node 20+ (see `.nvmrc`) and a PostgreSQL 13+ database (local Docker or Supabase).

```bash
npm install                 # once, from the repo root: installs both workspaces
npm run typecheck           # backend + frontend
npm run lint                # ESLint with type-aware rules
npm test                    # Jest (backend) + Vitest (frontend), no database needed
```

### Backend

```bash
cp backend/.env.example backend/.env   # then set DATABASE_URL
npm run migration:run -w backend       # create the schema
npm run seed -w backend                # load 10,000 employees (same data every run)
npm run dev:backend                    # API on http://localhost:3000
```

The seed refuses to run against a table that already has data. To replace existing data, run `npm run seed -w backend -- --reset`.

### Frontend

```bash
cp frontend/.env.example frontend/.env   # VITE_API_URL points at the API (local or deployed)
npm run dev:frontend                     # http://localhost:5173
```

### Integration tests

Unit tests need no database. The integration tests run the real SQL (aggregates, filters, the import upsert, constraints) against PostgreSQL and need a **separate database whose name ends in `_test`**: they rebuild the schema and empty the table on every run, and refuse to run against any other database. CI provides one automatically. Locally, any PostgreSQL works:

```bash
# Any one of these, then set TEST_DATABASE_URL to it:
#   Docker:            docker run -d -p 5433:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=salary_test postgres:16
#   Local PostgreSQL:  createdb salary_test
#   Hosted (Supabase): CREATE DATABASE salary_test;  and use your connection string with /salary_test
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/salary_test
export TEST_DATABASE_SSL=false          # true for Supabase or other hosted Postgres
npm run test:integration -w backend
```

## Deployment

The API is deployed to Render from [`render.yaml`](render.yaml) (see ADR-10):

1. Create the Supabase project in a **specific** region, **Southeast Asia (Singapore)**, the same region as the API. The general "Asia-Pacific" option can place it elsewhere, and cross-region latency more than doubles response times (ADR-10).
2. In Render, choose **New → Blueprint** and select this repository.
3. Set `DATABASE_URL` to the Supabase **session pooler** connection string and `CORS_ORIGIN` to the frontend's URL.
4. Deploy. On every start the service runs pending migrations, then starts the API; Render's health check calls `/health`, which also checks the database.
5. Load the data once, from a local machine with `DATABASE_URL` pointing at the same database: `npm run seed -w backend`.

The free instance sleeps after 15 minutes without traffic, so the first request after a pause can take up to a minute.

The frontend is deployed to Vercel from [`frontend/vercel.json`](frontend/vercel.json), which sends every path to the single-page app so deep links such as `/insights?country=JP` survive a refresh:

1. In Vercel, choose **Add New → Project** and import this repository.
2. Set **Root Directory** to `frontend` (Vercel installs the npm workspaces from the repository root).
3. Add the environment variable `VITE_API_URL` with the API's URL, without a trailing slash.
4. Deploy, then set `CORS_ORIGIN` on Render to the Vercel URL, again without a trailing slash, so the browser may call the API.

## Project status

- [x] Requirements, architecture and decision records
- [x] Backend: setup, data model, employee CRUD and directory
- [x] Backend: filter options, seed data and salary insights
- [x] Backend: Excel import / export
- [x] Frontend: design system, app shell and employee directory with add, edit and delete
- [x] Frontend: salary insights (headcount, per-country summary, job-title breakdown)
- [x] Frontend: Excel import with row-level error report, and export of the filtered directory
- [x] Deployment: API on Render, frontend on Vercel, database on Supabase
- [x] Video demo

# Salary Management

A web application that lets ACME's HR Manager manage salary data for 10,000 employees across multiple countries, and answer questions about how the organization pays people, without spreadsheets.

| | |
|---|---|
| **Live app** | _coming soon_ |
| **API** | _coming soon_ |
| **Video demo** | _coming soon_ |

## Features

- **Employee directory**: server-side paginated list of 10,000+ employees with search, filters (country, department, job title) and sorting.
- **Employee management**: create, view, edit and delete employees with full validation.
- **Salary insights**: per-country min, max, average and median salary; per-job-title breakdown within a country; headcount by country and department.
- **Excel import / export**: template download, validated all-or-nothing import with row-level error reports, and filtered export.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), MUI, TanStack Query |
| Backend | NestJS, TypeORM |
| Database | PostgreSQL (Supabase) |
| Testing | Jest, Vitest, React Testing Library |
| Hosting | Vercel (frontend), Render (backend) |

## Documentation

| Document | Contents |
|---|---|
| [Requirements](docs/requirements.md) | Goal, scope, deliberate exclusions and reasoning |
| [Architecture](docs/architecture.md) | System and data model diagrams, API, performance and testing strategy |
| [Decision records](docs/decisions.md) | Key decisions, alternatives considered and trade-offs |
| [AI workflow](docs/ai-workflow.md) | How AI tools were used and verified, with the [prompt log](docs/prompts/) |
| [Agent instructions](CLAUDE.md) | Standing conventions given to the AI coding agent |

## Getting started

This is an npm-workspaces monorepo: `backend/` (NestJS API) and `docs/`. Requires Node 20+ (see `.nvmrc`) and a PostgreSQL 13+ database (local Docker or Supabase).

```bash
npm install                 # once, from the repo root
npm run typecheck
npm test                    # Jest, no database needed
```

### Backend

```bash
cp backend/.env.example backend/.env   # then set DATABASE_URL
npm run dev:backend                    # API on http://localhost:3000
```

## Project status

- [x] Requirements and architecture
- [ ] Backend: employees CRUD and directory
- [ ] Seed script (10,000 employees)
- [ ] Salary insights
- [ ] Excel import / export
- [ ] Frontend
- [ ] Deployment and video demo

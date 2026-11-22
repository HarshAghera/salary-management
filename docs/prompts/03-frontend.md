# Phase 03 — Frontend

**Tool:** Claude Code (agentic, in the repository) · **Goal:** build the React frontend screen by screen (app shell and design system, employee directory, salary insights, Excel import and export), test it end to end against a real API and database, and deploy it.

Key prompts from the session.

| # | Prompt | Produced |
|---|---|---|
| 1 | Set up the frontend foundation and a modern design system | Vite workspace, typed API client, app shell, Teal & mint theme in light and dark, ADR-11 |
| 2 | Build the employee directory and employee management | Server-side grid, phone cards, search and filters in the URL, add/edit form, delete, ADR-12 |
| 3 | Build the salary insights screen | Headcount tiles and bars, per-country summary, job-title breakdown |
| 4 | Build Excel import and export | Template download, import with a row-by-row error report, filtered export |
| 5 | Test the whole application end to end and fix what it finds | API edge-case probe, browser scenarios on a throwaway database, eight fixes |
| 6 | Prepare the frontend deployment | Vercel config with SPA routing, deployment steps |

---

### 1. Set up the frontend foundation and a modern design system

**Intent:** Give every later screen a consistent, modern look and one well-tested way to talk to the API.

> Set up the React frontend as the second npm workspace (Vite, MUI, TanStack Query, React Router), following `CLAUDE.md` and the responsive layout table in the architecture.
> - A typed API client that is the only module knowing URLs, and that turns every failure (including an unreachable server and the import's row errors) into one error type.
> - An app shell: a solid brand top bar with section tabs on desktop, and a menu drawer on phones and tablets. Light and dark mode follow the device, can be switched, and never flash white on load.
> - The look must be modern, not a default component library. Take the layout cues from the HRMS reference design I shared: a coloured top bar with an underlined active tab, white cards with soft shadows on a tinted canvas, and filled primary with outlined secondary buttons. Use the Poppins typeface, bundled with the app.
> - Show me several palette options side by side in light and dark mode before changing any code. The brand colour must be the same in both modes, and dark mode must not be a large near-black area.
>
> Record the design rules as an ADR. Test the client and the shell, and check every screen visually at 360, 768 and 1280 px.

**Outcome:** Workspace, CI, typed client with 11 tests and an app shell with 8 tests (navigation per breakpoint, active tab, colour-mode switch, 404). A comparison page showed four green-based palettes and the existing periwinkle on the same sample screen in both modes. The chosen "Teal & mint" theme uses one brand teal (`#0F766E`, 5.5:1 contrast for white text) in both modes, teal-tinted dark surfaces, a leaf-green success colour kept distinct from the brand, and status colours reserved for meaning. Recorded as ADR-11.

**Human decision:** Teal & mint, chosen from the side-by-side comparison: a blue-green brand stays distinct from the green of success messages, and tinted dark surfaces remove the "large black area" of an untinted dark mode. The same brand colour is used in both modes so the product reads as one.

---

### 2. Build the employee directory and employee management

**Intent:** Let HR find, add, update and remove any of 10,000 employees on any device, and share exactly what they are looking at.

> Build the Employees screen on the existing API:
> - Desktop: a server-side data grid with paging, sorting on name, salary and hire date only, and a page-size choice. Tablet: the same grid with essential columns. Phone: a card list with a "Show more" button.
> - Search by name or email (sent after typing pauses), and filters for country, department and job title. Keep search, filters, sort and page in the URL so a view can be bookmarked, shared and refreshed. Page, filter and sort changes are steps the browser's Back and Forward move through; typing in search is not.
> - An add/edit form (a full-screen dialog on phones) that checks the API's rules before sending and shows a duplicate email on the email field. Deletion asks for confirmation and names the person.
> - Salaries in each country's currency, with the sign separated from the digits ("₹ 850,400"). Sorting by salary across countries orders numbers in different currencies, so say so on screen.
>
> Test the URL state, formatting and validation as pure functions, and the screen's behaviour with the API mocked.

**Outcome:** URL state read and written by pure, unit-tested functions; paging, filters and sort as history steps, search replacing the current step. Grid, phone cards and the form, with 30 page tests and 25 unit tests. Visual checks at all three widths found and fixed cards overflowing on phones, the delete button clipped on tablets, salaries misaligned in their cells, and an ungrouped page count. A hint appears when salary sorting mixes currencies. Recorded as ADR-12.

**Human decision:** Salaries stay in each country's own currency, because the brief's questions compare pay within a country and conversion would need a rate policy. The cross-currency sort is kept, with an explicit hint, rather than converted. Back and Forward step through views, as people expect in a browser.

---

### 3. Build the salary insights screen

**Intent:** Answer HR's questions about pay at a glance, with figures that can be trusted.

> Build the Insights screen from the three insight endpoints:
> - Headcount tiles, and headcount by country and by department as simple bars, largest first.
> - A per-country table of headcount, median, average, lowest and highest salary in local currency, where choosing a country opens its job-title breakdown.
> - The job-title breakdown for one country, highest average first, with a bar for each average (fair, because one country means one currency). Keep the chosen country in the URL.
>
> The requirements limit charts to tables and simple bars, so add no chart library: one hue, every value labelled. Refresh the insights whenever an employee is saved or deleted. Handle loading, errors with a retry, and an empty organization.

**Outcome:** Stat tiles, CSS bar lists and two tables with no new dependency. Nine page tests cover totals, ordering, local-currency figures, the country in the URL, choosing a country from the table or the picker, retry and the empty state. Visual checks fixed tall table rows, wrapping country names on phones, job-title bars collapsing on tablets, truncated tile details, and tables that scrolled sideways at 768 px.

**Human decision:** Keep charts to what the requirements allow and let the numbers carry the screen; averages and medians are shown in whole units, individual salaries with their cents.

---

### 4. Build Excel import and export

**Intent:** Let HR move data between spreadsheets and the app without retyping it.

> Build the Import & export screen:
> - Three steps: download the template, choose a file (drag and drop or a button), import. Check the file type and size before uploading.
> - On success, show how many employees were added and updated, and refresh the directory and insights. On rejection, show every problem by row, column and reason: a table on wider screens, a list on phones.
> - Export everyone from this screen. Put an Export button on the Employees screen that downloads exactly the current search, filters and sort.
>
> Download files through the API client so buttons can show progress and failures. Verify against the real API with a deliberately broken file.

**Outcome:** The screen, a typed download helper and 14 tests (client checks, success counts, the error report as a table and as a list, a server-side 413, export success and failure, and a filtered export from the directory). An upload of a deliberately invalid file to the real API produced the row-by-row report and wrote nothing.

**Human decision:** Exporting the filtered list belongs on the directory, where the filters are, and the import screen links there rather than duplicating the filters.

---

### 5. Test the whole application end to end and fix what it finds

**Intent:** Confirm that every feature works on every screen size before deploying, not just the paths the unit tests cover.

> Test the complete application, every corner of it, and report anything that does not work properly before changing code.
> - Run every test suite, lint, typecheck and build, and the integration tests against a real PostgreSQL.
> - Probe the API's edge cases: paging bounds, sort whitelist, injection attempts, wildcard and non-English searches, validation limits, duplicate emails, unknown ids, import limits and CORS.
> - Drive the real UI in a browser at 360, 768 and 1280 px in both colour modes: directory, add/edit/delete, Excel round trips, insights, navigation, keyboard use, touch-target sizes, sideways scrolling, names containing HTML, double submits, records deleted in another tab, and the API going down.
> - Run anything that writes data against a throwaway local database only, never the deployed one.

**Outcome:** 79 of 79 API edge cases passed locally, and the read-only checks passed against production. Browser scenarios on a throwaway PostgreSQL seeded with the same 10,000 employees covered every flow, including a filtered export re-imported unchanged as 0 added and 403 updated. Eight issues were found and fixed, each with a test written first:
- the import reported an empty cell as "too long" (or, for salary, "too large") instead of "required"
- a filtered link briefly showed "All countries" while options loaded
- a record deleted elsewhere showed a raw ID and stayed listed until reload
- an unreachable server took about 8 s to report, because every request was retried three times
- every page had the same browser tab title
- the grid's rows-per-page control was 29 px tall
- a column divider pushed the grid 5 px wider than its box

Earlier in the phase, review also found the grid's next page snapping back to page 1 and the browser's date picker ignoring the theme. Both were fixed: memoised grid models, with a regression test that waits for the grid's delayed adjustment, and MUI's themed date picker, loaded only when the form opens.

**Human decision:** Every corner of the application is tested before deployment, and only data-changing tests on a disposable database. Fixes ship as a single reviewed commit.

---

### 6. Prepare the frontend deployment

**Intent:** Put the frontend online next to the API with deep links and caching working.

> Prepare the frontend for Vercel from this monorepo: the `frontend` workspace as the project root, the API URL as an environment variable, every path served by the single-page app so links such as `/insights?country=JP` survive a refresh, and long-lived caching for the fingerprinted assets. Document the steps, including setting the API's allowed origin to the new URL.

**Outcome:** `frontend/vercel.json` and deployment steps in the README. The live site was then checked read-only: every path, including deep links and unknown pages, serves the app; fingerprinted assets are cached for a year; the API accepts the Vercel origin; and a browser pass loaded the directory in 1.2 seconds, paged, filtered, opened an Insights deep link and rendered the phone layout in dark mode with no console errors.

**Human decision:** The API keeps a single allowed origin: the production frontend. Local development uses its own local configuration.

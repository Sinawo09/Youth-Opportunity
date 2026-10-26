# SQLite Backend Setup

The portal API uses Express and a local SQLite database; it requires no remote database credentials.

## Requirements

- Node.js 20 or newer
- npm

## Install and start

From the project root, install the backend dependencies once and start the API with:

```powershell
npm install --prefix backend
npm run dev
```

The root command reuses an already healthy API on the configured port. If another process owns that port but is not this API, startup reports the conflict and leaves the process untouched. You can also run `npm.cmd run dev` from this `backend` directory. The API listens on port `5000` by default; `PORT` can override it. If you override the port, set `window.YOP_API_BASE_URL` to `http://localhost:<port>` before the frontend API scripts load. Open `http://localhost:5000/api/health`; a healthy response is `{"success":true,"data":{"status":"ok"}}`. Serve the website from an allowed local origin such as `http://localhost:5500` or `http://127.0.0.1:5500`.

SQLite creates its schema automatically on first startup. By default, the database is `backend/data/portal.sqlite`; set `SQLITE_DB_PATH` in `.env` to use another file. Versioned SQL migrations in `db/migrations/` are applied once and recorded in `schema_migrations`. The opportunity verification migration archives old rows tagged `sample:*` by unpublishing them, clearing their mock URLs and retaining their records so saved items and application history are not cascaded away. The database, WAL, and shared-memory files are ignored by Git. Back up the SQLite file regularly and stop the API before copying it.

The API does not seed sample or fallback opportunities. The public endpoint returns only verified listings with a future closing date. Existing accounts and remote opportunity records are not imported automatically. Users must register again in the SQLite-backed portal; previous password hashes are not compatible.

## First administrator

1. Register a normal account at `http://localhost:5500/account.html`.
2. From this `backend` directory, promote that account:

   ```powershell
   npm.cmd run admin:promote -- user@example.com
   ```

The command changes only the role for an existing account. Normal registration cannot assign an administrator role.

## Security and behavior

- Passwords are stored as salted `scrypt` hashes, never as plain text.
- Access and refresh tokens are random opaque values; SQLite stores only their SHA-256 hashes. Access tokens expire after 15 minutes; rotated refresh tokens expire after 30 days.
- Foreign keys, unique email/application constraints, and owner/admin checks are enforced in SQLite and Express.
- Opportunity create, edit, verify, expire, archive, and admin-list actions are authenticated and admin-only. Server validation requires HTTP(S) official-source and direct application URLs, a closing date, a minimum qualification, and source-entered eligibility. Editing resets verification; only the explicit confirmation route publishes a record.
- The current checkout is SQLite-only. `backend/supabase/migrations/` contains no schema, and the application has no Supabase client or project URL/key configuration. Do not put a Supabase service-role key in frontend code. Supabase RLS cannot be applied to an unconfigured project from this workspace.
- Use HTTPS and protect the database file and backups in production. SQLite is a single-host database; for multi-instance deployment, use a shared server database instead.

## Manual Opportunity Verification

There is no automated opportunity collector in this project. The official pages checked for this update did not expose a public API or RSS/Atom feed suitable for importing listings. Review each notice manually; do not copy a category page or organisation homepage into the application URL field.

1. Open the official opportunity notice and confirm the exact title, organisation, province/location, closing date, eligibility, minimum qualification, and application instructions.
2. Open the direct application URL and confirm it leads to that same live opportunity. Do not add expired or sign-in-gated listings as active.
3. Add the record in `admin/opportunities.html`. It remains private until its source and application links have been checked.
4. Check the confirmation box and choose **Verify**. This records the checked timestamp and publishes the listing. Editing clears that verification and removes it from public results until checked again.
5. Use **Expire** when a listing closes early, or let the dated record fall out of public results automatically. Use **Remove** to archive it without deleting saved/application references.

Official pages checked on 22 October 2026:

- [NYDA Opportunities Corner](https://www.nyda.gov.za/Opportunities.html) lists employer notices and links to the NYDA ERP jobs portal. It is a manually maintained directory, not a structured feed; the ERP portal requires sign-in.
- [DPSA Public Service Vacancy Circular](https://www.dpsa.gov.za/newsroom/psvc/) states that circulars are published weekly and links to PDF circulars. No public structured feed was identified in the checked page.
- The NYDA-listed [Vodacom 2027 Early Careers listing](https://vodafone.eightfold.ai/careers/job/563018696893545) resolves to the employer page, which says it is no longer accepting applications and gives a 31 August 2026 closing date.
- The NYDA-listed [SACAA internship listing](https://sacaa.mcidirecthire.com/External/Job?Ref=TEkBhDYErs0qhHgueWeCgt_yRI-cnPLR1MRk1RR6Cpou3ktpvROhSqni_BGkK6j0nLY93QeL7OBvxX6VW-hDeq5AmIloHffHR0zQpbU6v_gVoXOkheEJorgByyCNF1j2ZaJh2CSvGAQuAsKRR7KstQ) resolves to the employer site, which says the job is no longer available.
- The NYDA-listed SAHPRA advert resolves to a PDF, but its text could not be extracted in this check; do not publish it until a person verifies the actual advert and application destination.

No genuine listings were imported during this change. The current public listing count is intentionally zero until an administrator verifies open opportunities.

## Tests

```powershell
npm.cmd test
```

The tests use an isolated in-memory SQLite database and cover migrations, no sample fallback, registration and login, password hashing, refresh rotation, logout, owner-scoped requests, saved opportunities, application uniqueness, admin-only opportunity management, duplicate-source protection, explicit verification, and expiry.

## API routes

| Method and path | Access | Purpose |
|---|---|---|
| `POST /api/auth/register` | Public | Create a local account and session |
| `POST /api/auth/login` | Public | Verify credentials and create a session |
| `POST /api/auth/refresh` | Public with refresh token | Rotate session tokens |
| `POST /api/auth/logout` | Signed in | Revoke the current session |
| `GET /api/auth/me` | Signed in | Get the current profile |
| `PATCH /api/auth/me` | Signed in | Update full name or province |
| `GET /api/users` | Admin | List profiles |
| `PATCH /api/users/:id/role` | Admin | Change a user's role |
| `GET /api/requests` | Signed in | Admin sees all; youth see only their own |
| `GET /api/requests/mine` | Signed in | List the current user's requests |
| `POST /api/requests` | Signed in | Create a request |
| `PATCH /api/requests/:id` | Owner, while pending | Update a request |
| `DELETE /api/requests/:id` | Owner or admin | Delete a request |
| `PATCH /api/requests/:id/review` | Admin | Review a request |
| `GET /api/opportunities` | Public | List published opportunities |
| `GET /api/opportunities?include_expired=true` | Public | View only verified listings marked expired or past deadline |
| `GET /api/opportunities?include_all=true` | Admin | List all opportunity records for review |
| `POST /api/opportunities` | Admin | Create an unverified opportunity draft |
| `PATCH /api/opportunities/:id` | Admin | Update a draft and reset verification |
| `POST /api/opportunities/:id/verify` | Admin | Confirm source check, stamp checked date, and publish |
| `POST /api/opportunities/:id/expire` | Admin | Remove an opportunity from active results |
| `DELETE /api/opportunities/:id` | Admin | Archive an opportunity without deleting references |
| `POST /api/applications` | Signed in | Apply to a published opportunity |
| `GET /api/applications/me` | Signed in | List the current user's applications |
| `PATCH /api/applications/:id` | Owner | Withdraw a submitted application |
| `DELETE /api/applications/:id` | Owner or admin | Delete an application |
| `PATCH /api/applications/:id/review` | Admin | Review an application |
| `GET /api/saved-opportunities` | Signed in | List the current user's saved opportunities |
| `POST /api/saved-opportunities` | Signed in | Save a published opportunity |
| `DELETE /api/saved-opportunities/:id` | Signed in | Remove a saved opportunity |

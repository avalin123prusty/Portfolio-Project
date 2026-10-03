# Portfolio Project

A portfolio website backed by a custom CMS and REST API. The repository is a monorepo containing three independent apps:

| App | Stack | Local URL | Purpose |
| --- | --- | --- | --- |
| Public portfolio | Next.js 16, React 19, Tailwind CSS | http://localhost:3000 | Home, About, Projects, Skills, Experience, Journal, Contact |
| CMS admin | React, Vite 6, Tailwind CSS 4 | http://localhost:5173 | Admin login, dashboard, content CRUD, media, contact inbox |
| API | Express, JWT, SQLite | http://localhost:5000 | Content API, auth, uploads, contact submissions |

## Requirements

- Node.js 22.13 or newer (Node 24 is used in CI and deployment; see `.nvmrc`)
- npm 10 or newer

SQLite is provided by Node's built-in `node:sqlite` module; no database service is needed for local development.

## Install

From the repository root:

```powershell
npm run setup
```

Or install each app separately:

```powershell
Set-Location apps/backend; npm ci
Set-Location ../cms; npm ci
Set-Location ../frontend; npm ci
```

## Run locally

Open three terminals at the repository root:

```powershell
npm run dev:backend
```

```powershell
npm run dev:cms
```

```powershell
npm run dev:frontend
```

Then open:

- Portfolio: http://localhost:3000
- CMS: http://localhost:5173
- API health: http://localhost:5000/api/health

The backend creates `apps/backend/data/portfolio.sqlite` and seeds example portfolio content on first start. Existing `store.json` content is migrated once when the SQLite database is first created. Uploaded media is stored in `apps/backend/uploads` by default.

### Local admin account

- Email: `admin@portfolio.local`
- Password: `admin123`

These are development defaults only. Set unique values in the backend `.env` before exposing a deployment.

## Environment

Copy the examples when you need to override defaults:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/cms/.env.example apps/cms/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
```

Backend settings are documented in `apps/backend/.env.example`. Important values:

- `PORT`: API port (default `5000`)
- `DATABASE_FILE`: SQLite filename under `apps/backend/data`, or an absolute path for a mounted disk
- `UPLOAD_PATH`: upload directory, relative to the backend app or an absolute mounted path
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`: separate signing secrets; production startup rejects example/default secrets
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: initial admin credentials. Passwords are stored as scrypt hashes in SQLite
- `CLIENT_URL`, `CMS_URL`, `CORS_ORIGINS`: explicit browser origins allowed by the API
- `PUBLIC_API_URL`: public origin used to form uploaded-media URLs
- `SMTP_*`, `CONTACT_TO`: optional SMTP delivery for contact submissions

The CMS reads `VITE_API_URL` and `VITE_PORTFOLIO_URL`. The public frontend reads `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`. Browser-visible variables must be set to public URLs, not server-only addresses.

## CMS features

- JWT login with short-lived access tokens and one-use, revocable refresh sessions
- Admin-only writes and admin-only message/media access
- Overview dashboard with content totals and recent inquiries
- About profile editor
- Create, edit, and delete for projects, skills, experience, blog posts, testimonials, and services
- Draft/published state for projects and posts; drafts are omitted from public pages
- Image library: JPEG, PNG, WEBP, and GIF, maximum 5 MB, with file-signature validation
- Private contact inbox with delete action

## Public portfolio

The public pages fetch their content from the API and render on the server:

- `/` home
- `/about`
- `/projects`
- `/skills`
- `/experience`
- `/blog` and `/blog/[slug]`
- `/contact`

The contact form validates input in the browser and API. Messages are saved in SQLite. When SMTP settings are supplied, the API also sends an email; without SMTP, local submissions are still saved successfully.

## API

All paths are prefixed with `/api`. Public GETs serve portfolio content. CMS mutation routes require `Authorization: Bearer <access-token>`; `/messages` and `/media` also require admin authentication.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health check |
| POST | `/auth/login` | Public | Validate credentials, return access and refresh tokens |
| POST | `/auth/refresh` | Public | Rotate refresh token and issue new credentials |
| GET | `/admin/me` | Admin | Validate current access token |
| GET | `/admin/analytics` | Admin | Content totals and recent messages |
| GET, PUT | `/about` | Public GET; admin PUT | Profile singleton |
| GET, POST, PUT, DELETE | `/skills` | Public GET; admin writes | Skill collection (item update/delete uses `/:id`) |
| GET, POST, PUT, DELETE | `/projects` | Public GET; admin writes | Project collection |
| GET, POST, PUT, DELETE | `/blogs` | Public GET; admin writes | Blog collection |
| GET, POST, PUT, DELETE | `/experience` | Public GET; admin writes | Experience collection |
| GET, POST, PUT, DELETE | `/testimonials` | Public GET; admin writes | Testimonial collection |
| GET, POST, PUT, DELETE | `/services` | Public GET; admin writes | Service collection |
| POST | `/contact` | Public | Validate, store, and optionally email an inquiry |
| GET, DELETE | `/messages` | Admin | Read and delete contact submissions |
| POST | `/upload/image` | Admin | Upload an image using multipart field `image` |
| GET, DELETE | `/media` | Admin | List and delete uploaded media |
| GET | `/content-models` | Public | Content model catalog |

Updates accept `PUT /resource/:id` (or `PUT /resource` with an `id` in the JSON body).

## Tests and production builds

```powershell
npm run test:backend
npm run audit
npm run build:cms
npm run build:frontend
```

GitHub Actions runs the backend integration tests and production builds for both frontends on pushes and pull requests to `main`.

## Deployment

A Render Blueprint is provided in `render.yaml` for the API, portfolio, and CMS.

1. Create a Render Blueprint from this repository and review the three services.
2. Provide `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` when prompted.
3. Render generates independent access/refresh JWT secrets.
4. The API Blueprint mounts a persistent disk at `/var/data` for SQLite and uploaded media. Persistent disks may have an additional platform cost.
5. Configure SMTP variables if contact email delivery is required.
6. If you use different service or custom domain names, update `CLIENT_URL`, `CMS_URL`, `CORS_ORIGINS`, `PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `VITE_API_URL`, and `VITE_PORTFOLIO_URL` accordingly, then redeploy.

**Storage constraint:** the SQLite/file-upload setup is designed for one API instance with a persistent disk. Do not horizontally scale the API across instances using local SQLite/files. For multi-instance scaling, move the persistence adapter to managed PostgreSQL and media to object storage such as S3-compatible storage. Back up the persistent disk regularly.

Production API startup refuses the development JWT secrets and default admin password. Never commit `.env` files or real credentials.

## Day-by-day delivery history

The project is being delivered as a sequence of meaningful commits on `main`. The initial repository setup, authentication, and content model commits are already in the remote history. Subsequent commits complete authorization, dashboard/CMS, public pages, submissions, analytics, validation, deployment preparation, and final documentation. See `docs/day-by-day-plan.md` for the portfolio-specific mapping and current status.

# Day-by-day delivery plan

The supplied schedule includes question/submission/results language from a different kind of app. Those milestones are mapped to the matching portfolio features below; no quiz or question-bank modules are part of this project.

| Day | Portfolio milestone | Delivered scope | Commit |
| --- | --- | --- | --- |
| 1 | Project setup | Monorepo and backend foundation | `Day 1: backend foundation` |
| 2 | Authentication | JWT admin login | `Day 2: authentication flow` |
| 3 | Content models and access control | Portfolio CRUD models; protected writes and private admin data | `Day 3: content model CRUD` (access-control hardening follows in Day 4) |
| 4 | Backend CMS foundation | SQLite storage, upload validation, contact processing, authorization | `Day 4: secure API, SQLite and media` |
| 5 | CMS dashboard and feature management | Admin login, dashboard, CRUD editors, inbox and media screens | `Day 5: custom CMS dashboard and editors` |
| 6 | Content model documentation | SQLite tables, fields, required values and publication rules | `Day 6: document portfolio content models` |
| 7 | Main user interface | Responsive portfolio home, navigation, CMS-backed home sections | `Day 7: build responsive portfolio interface` |
| 8 | Submission and processing | Contact form validation and API submission | `Day 8: connect the portfolio contact flow` |
| 9 | Published content pages | CMS-fed About, Projects, Skills, Experience, Journal, sitemap and robots | `Day 9: add dynamic portfolio content pages` |
| 10 | Admin dashboard workflows | Sign-in, content editing, media, inbox, analytics guide | `Day 10: document admin dashboard workflows` |
| 11 | Admin analytics | Protected metrics and recent inquiries with focused tests | `Day 11: verify admin analytics access` |
| 12 | Testing and validation | Auth, CRUD, contact/rate-limit and media integration coverage | `Day 12: test auth, CRUD, contact and media` |
| 13 | Deployment preparation | Render blueprint, CI, Node version and app-local lockfile setup | `Day 13: prepare CI and production deployment` |
| 14 | Final readiness | Complete setup/API/deployment docs, platform PORT handling, and configured-admin migration regression | `Day 14: finalize project documentation`; deployment follow-up pushed after production smoke tests |

## Run locally

Use Node.js 22.13+ (Node 24 is used by CI). From the repository root:

```powershell
npm run setup
```

Open a separate terminal for each app:

```powershell
npm run dev:backend
npm run dev:cms
npm run dev:frontend
```

Local URLs:

- Portfolio: http://localhost:3000
- CMS: http://localhost:5173
- API: http://localhost:5000

## Verification commands

```powershell
npm run test:backend
npm run audit
npm run build
```

## Git milestones

The initial three commits were already present on `main`; their history is preserved. Days 4–14 are each published as separate, descriptive commits. Day 14 has a follow-up commit for issues caught by production start-command smoke tests. The original third commit is named for content CRUD; its missing authorization hardening is included in the Day 4 backend security commit rather than rewriting the remote history.

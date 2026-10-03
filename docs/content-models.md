# Content models

The API persists structured records in SQLite. `apps/backend/src/utils/fileStore.js` creates the schema and seeds a first-run portfolio; existing `store.json` data is migrated when a database is initialized. During that one-time migration, the configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` replace the legacy admin credentials.

## Tables

| Table | Shape | Key fields |
| --- | --- | --- |
| `users` | Collection | `id`, unique `email`, scrypt `password_hash`, `role`, JSON payload |
| `refresh_sessions` | Collection | `id`, `user_id`, `expires_at`, `revoked_at` |
| `about` | Singleton | JSON profile payload |
| `skills` | Collection | `id`, `name`, `category`, `level`, `featured` |
| `projects` | Collection | `id`, `title`, `slug`, `description`, `image`, `stack`, URLs, `featured`, `status` |
| `blogs` | Collection | `id`, `title`, `slug`, `excerpt`, `content`, `date`, `readTime`, `coverImage`, `status` |
| `experience` | Collection | `id`, `company`, `role`, `period`, `location`, `description` |
| `testimonials` | Collection | `id`, `name`, `role`, `quote` |
| `services` | Collection | `id`, `title`, `description` |
| `messages` | Collection | `id`, `name`, `email`, `message`, `createdAt` |
| `media` | Collection | `id`, `name`, `url`, `mimetype`, `size`, `createdAt` |

Collection rows use a primary key plus a JSON payload so the CMS can extend portfolio-specific optional fields without a schema migration for every text field. Required API fields are validated at write time:

- Skill: `name`
- Project: `title`, `description`
- Blog: `title`, `content`
- Experience: `company`, `role`
- Testimonial: `name`, `quote`
- Service: `title`, `description`

Projects and blog posts with `status: "draft"` are omitted from public website reads. Public content GET routes never expose users, refresh sessions, contact messages, or private media metadata.

## Persistence and deployment

SQLite and uploaded files live on disk. Local defaults are `apps/backend/data/portfolio.sqlite` and `apps/backend/uploads`. Set `DATABASE_FILE` and `UPLOAD_PATH` to a persistent mounted volume in production. This deployment is for one API instance; use managed PostgreSQL and object storage before scaling across multiple instances.

# Admin guide

## Sign in

Open http://localhost:5173 and use the development credentials shown in the README. In production, set a unique `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the API's first start. The password is stored as a scrypt hash, not plaintext.

Access tokens expire after 15 minutes by default. The CMS rotates one-use refresh sessions automatically. Signing out revokes the active refresh session in SQLite.

## Manage content

The sidebar links to About, Projects, Skills, Experience, Journal, Testimonials, Services, Messages, and Media. Collection managers use the same create/edit/delete flow; project and blog status can be set to `draft` or `published`. Draft projects and posts are not rendered on the public site.

About is a singleton profile record. Skills use a proficiency value from 0 to 100. Projects accept a comma-separated stack in the form and persist it as an array. Blog slugs are generated from the title when left blank.

## Media

Choose an image in Media Library and upload it. The API accepts JPEG, PNG, WEBP, and GIF files up to 5 MB, validates the actual image signature, and returns a public URL. Copy that URL into the project cover or blog cover field. Deleting a media item removes both its metadata and its stored file.

## Inbox and analytics

Contact submissions are private to authenticated administrators. The overview shows collection totals and the latest messages; the Messages page supports email replies and deletion. Contact messages persist even when SMTP is not configured. Configure SMTP variables to enable email notifications.

## Troubleshooting

- API connection errors: check that `VITE_API_URL` points to the API origin and that the API allows the CMS origin in `CORS_ORIGINS`.
- Session expired: sign in again; refresh sessions are one-use and automatically rotated.
- Image rejected: use a real supported image under 5 MB, not a renamed document.
- Uploaded links fail in production: set `PUBLIC_API_URL` to the public API origin and store files on the persistent disk.

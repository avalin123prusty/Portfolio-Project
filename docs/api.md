# REST API reference

Base URL: `http://localhost:5000/api`

## Authentication

`POST /auth/login`

```json
{
  "email": "admin@portfolio.local",
  "password": "admin123"
}
```

Returns `{ user, token, refreshToken, expiresIn, refreshExpiresIn }`. Use the access token on protected routes:

```http
Authorization: Bearer <token>
```

`POST /auth/refresh` accepts `{ "refreshToken": "..." }` and rotates both tokens. Refresh tokens cannot be used to access CMS routes, and each refresh token can only be used once. `POST /auth/logout` revokes the refresh session. `GET /admin/me` validates an access token.

## Content

Public collection `GET` routes:

- `/about` (singleton)
- `/skills`
- `/projects`
- `/blogs`
- `/experience`
- `/testimonials`
- `/services`

Writes to these collections require an admin access token. Create with `POST /projects`; update and delete collection items with `PUT /projects/:id` and `DELETE /projects/:id`. Updates can also use `PUT /projects` with an `id` field. `about` uses `PUT /about`.

Common resource fields:

- `skills`: `name` required; optional `category`, numeric `level`, `featured`
- `projects`: `title` and `description` required; optional `slug`, `image`, `stack` (array), `liveUrl`, `githubUrl`, `featured`, `status`
- `blogs`: `title` and `content` required; optional `slug`, `excerpt`, `date`, `readTime`, `coverImage`, `status`
- `experience`: `company` and `role` required; optional `period`, `location`, `description`
- `testimonials`: `name` and `quote` required; optional `role`
- `services`: `title` and `description` required

`status: "draft"` hides projects and posts from public portfolio pages. The CMS can still read and edit them.

## Contact and media

- `POST /contact` is public. JSON fields: `name` (2-120 chars), valid `email`, and `message` (10-5000 chars). A per-process IP limit is applied. The API persists the message before attempting optional SMTP delivery.
- `GET /messages` and `DELETE /messages/:id` require an admin token.
- `POST /upload/image` requires an admin token and `multipart/form-data` field `image`. JPEG, PNG, WEBP, and GIF are accepted up to 5 MB. Both MIME type and file signature are checked.
- `GET /media` and `DELETE /media/:id` require an admin token.
- `GET /admin/analytics` returns collection totals and recent messages.
- `GET /content-models` lists the supported models.

## PowerShell example

```powershell
$login = Invoke-RestMethod `
  -Uri 'http://localhost:5000/api/auth/login' `
  -Method Post `
  -ContentType 'application/json' `
  -Body (@{ email = 'admin@portfolio.local'; password = 'admin123' } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri 'http://localhost:5000/api/projects' -Headers $headers
```

## Error responses

Errors use JSON `{ "message": "..." }`. Common statuses are `400` validation, `401` missing/expired access token, `403` invalid token or CORS origin, `404` missing content, `413` image exceeds the upload limit, and `429` contact rate limit.
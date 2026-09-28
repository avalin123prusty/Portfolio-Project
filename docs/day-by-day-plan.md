# Day-by-day project roadmap

## Day 1 — Backend + database foundation
- Create backend structure
- Add Express server
- Add JSON-backed data store
- Add env configuration

## Day 2 — Authentication
- Create JWT login flow
- Add protected route middleware
- Set admin credentials

## Day 3 — Content models and CRUD
- Add about, skills, projects, blogs, experience, testimonials, and services APIs
- Add message collection and storage

## Day 4 — File uploads and media APIs
- Add upload endpoint
- Save files in `apps/backend/uploads`
- Expose uploaded URLs

## Day 5 — CMS Admin UI shell
- Set up Vite + React app
- Add login page
- Add dashboard shell

## Day 6 — CRUD screens I
- Add About editor
- Add Skills manager

## Day 7 — CRUD screens II
- Add projects/blogs workflow
- Add UI refinements

## Day 8 — Frontend setup
- Create Next.js app
- Set Tailwind theme and page shell

## Day 9 — CMS data integration
- Fetch about/skills/projects from backend
- Display live content

## Day 10 — Portfolio sections
- Add blogs, testimonials, services, and experience sections

## Day 11 — Contact page and submission flow
- Add contact form
- Connect to `/api/contact`

## Day 12 — Deployment prep: backend
- Configure CORS
- Set production env values
- Prepare deployment scripts

## Day 13 — Deployment prep: CMS + frontend
- Configure frontend API URLs
- Prepare CMS build output
- Set production domains

## Day 14 — Final QA and polish
- Validate APIs
- Check build outputs
- Security review and final deployment checklist

## Local commands

```bash
cd "C:\Users\User\Desktop\Portfolio Project"

npm --prefix apps/backend install
npm --prefix apps/cms install
npm --prefix apps/frontend install

npm --prefix apps/backend run dev
npm --prefix apps/cms run dev
npm --prefix apps/frontend run dev
```

## Git push workflow per day

```bash
git add .
git commit -m "Day 1: backend foundation"
git push -u origin main
```

Repeat for each day with the corresponding message.

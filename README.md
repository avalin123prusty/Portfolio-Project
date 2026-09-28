# Portfolio Project

A full-stack portfolio website with a custom CMS and admin dashboard built as a monorepo.

## Apps

- Frontend: `apps/frontend` (Next.js + Tailwind)
- Backend CMS API: `apps/backend` (Express + JWT + custom JSON database)
- Admin CMS: `apps/cms` (React + Vite)

## Local development

1. Install dependencies:

   npm install

2. Start backend:

   npm run dev:backend

   API: http://localhost:5000

3. Start CMS admin:

   npm run dev:cms

   Admin UI: http://localhost:5173

4. Start frontend:

   npm run dev:frontend

   Frontend: http://localhost:3000

## Default admin account

- Email: admin@portfolio.local
- Password: admin123

## Environment files

Copy the example files and update values if needed:

- `apps/backend/.env.example`
- `apps/frontend/.env.example`
- `apps/cms/.env.example`

## Deployment notes

- Backend should run behind a production environment with `PORT`, `JWT_SECRET`, and `CLIENT_URL` configured.
- Frontend should use `NEXT_PUBLIC_API_URL` pointing to the deployed backend.
- CMS should use `VITE_API_URL` pointing to the deployed backend API.

## Project statuses

This project is structured to support a clean Day 1 to Day 14 implementation flow and is ready to be extended for deployment.

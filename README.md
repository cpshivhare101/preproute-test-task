# PrepRoute - Test Management Application

A 5-page React + TypeScript application for creating, managing, and publishing tests. Built per the PrepRoute Figma designs with full API integration.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Zustand (auth & test flow state)
- Axios (API client)
- React Hook Form + Zod (validation)
- React Hot Toast (notifications)
- Lucide React (icons)

## Pages

1. **Login** – JWT auth, form validation, redirect to dashboard
2. **Dashboard** – List all tests with search, edit/view/delete, create new test
3. **Create/Edit Test** – Subject, topics, sub-topics, marking scheme, draft save
4. **Add Questions** – MCQ editor with 4 options, sidebar navigation, bulk save
5. **Preview & Publish** – Test summary, publish now/schedule, live-until options

## Getting Started

```bash
npm install
cp .env.example .env   # optional – default API URL is preconfigured
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Test Credentials

- **User ID:** `vedant-admin`
- **Password:** `vedant123`

### API Base URL

```
https://admin-moderator-backend-staging.up.railway.app/api
```

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Start dev server     |
| `npm run build`| Production build     |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── api/           # Axios client & API services
├── components/    # Layout, UI, modals
├── pages/         # Route pages (5 flows)
├── store/         # Zustand stores
└── types/         # TypeScript interfaces
```

## Application Flow

Login → Dashboard → Create Test → Add Questions → Preview & Publish → Dashboard

JWT tokens are stored in `localStorage`. All authenticated requests include `Authorization: Bearer <token>`.

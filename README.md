# AccrediAssist

AI-Powered Academic Accreditation Management System for NBA, NAAC, and AICTE evidence management.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| Backend | Node.js, Express.js, TypeScript, Mongoose |
| Database | MongoDB Atlas |
| AI | OpenAI-compatible API |
| Files | Cloudinary |
| WhatsApp | Baileys (development) |

## Project Structure

```text
AccrediAssist/
├── docs/                 # Project specification (20 documents)
├── frontend/             # Next.js application
├── backend/              # Express.js API
├── package.json          # Root workspace config
└── README.md
```

## Prerequisites

- Node.js >= 20
- npm >= 10
- Git
- MongoDB Atlas account

## Setup

### 0. Git configuration

If `.gitignore` does not exist at the project root, rename the provided template:

```bash
# Windows (PowerShell)
Rename-Item gitignore .gitignore

# macOS / Linux
mv gitignore .gitignore

git init
git checkout -b develop
```

Recommended branches: `main` → `develop` → `feature/*`

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` with your MongoDB URI, JWT secret, and API keys.

### 3. Run development servers

```bash
# Run both frontend and backend
npm run dev

# Or run individually
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend and backend concurrently |
| `npm run build` | Build both workspaces |
| `npm run lint` | Lint frontend and backend |
| `npm run format` | Format code with Prettier |

## API

- Health check: `GET http://localhost:5000/health`
- API base URL: `http://localhost:5000/api/v1`

## Documentation

All project documentation is in the [`docs/`](./docs/) folder.

## License

Private — Final Year Project

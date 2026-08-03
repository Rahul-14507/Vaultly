# Vaultly

A lightweight, self-hosted personal paste and file-sharing service.

## Project Stack

- **Backend**: Node.js + Express (TypeScript), `better-sqlite3` database.
- **Frontend**: Vite + React (TypeScript), Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

Install all workspace and project-level dependencies:

```bash
npm run install:all
```

### Development

Run both the server and frontend concurrently in development mode:

```bash
npm run dev
```

The frontend will run on [http://localhost:5173](http://localhost:5173) and proxy backend requests to [http://localhost:3000](http://localhost:3000).

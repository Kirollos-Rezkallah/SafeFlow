# SafeFlow MVP

SafeFlow is a small accessibility MVP that acts as a safety layer for web-based exam-like forms.  
It focuses on users with motor impairments and reduces irreversible failures such as accidental submission, accidental exit, and loss of typed input.

The MVP demonstrates:

- Continuous autosave of form input tied to a SafeFlow user account (not device/browser autofill)
- Recovery flow after reload or interruption (restore or discard)
- Confirmation before irreversible actions (submit / sign out)
- Keyboard-first interactions and accessible dialogs

---

## Repository structure

This repository contains two folders:

- `safeflow-frontend` — React + Vite web app (UI + client-side autosave/recovery logic)
- `safeflow-backend` — Node.js + Express API (draft storage and retrieval)

---

## Demo flow (what to show)

1. Sign in with an email (MVP auth).
2. Open the session and start typing in the answer field.
3. Wait for the “Saved” indicator.
4. Refresh the page (or close and reopen the tab).
5. A restore prompt appears. Choose **Restore**.
6. Your input returns.
7. Click **Submit** and confirm. Submission finalizes.

---

## Tech stack

Frontend:

- React 18
- Vite
- Accessible UI patterns (dialogs, focus management)

Backend:

- Node.js
- Express
- Simple draft storage for MVP

---

## Setup (local)

### 1) Backend

```bash
cd safeflow-backend
npm install
npm run dev
```

### 2) Frontend

Open a new terminal:

```bash
cd safeflow-frontend
npm install
npm run dev
```

### Environment variables

Frontend (safeflow-frontend)

Create a .env file:

```
cd safeflow-frontend
touch .env
```

Add:

```

VITE_API_BASE=http://localhost:3001

```

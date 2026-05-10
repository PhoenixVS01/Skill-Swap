# SkillSwap MVP

SkillSwap is a beginner-friendly full-stack app to exchange skills through profile matching and one-to-one chat.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs
- Frontend: React (Vite), React Router, Axios, modern CSS

## Folder Structure

```text
btechMajorProject/
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    .env.example
    package.json
    server.js
  client/
    src/
      components/
      context/
      pages/
      services/
      App.jsx
      main.jsx
      styles.css
    .env.example
    package.json
    index.html
  .gitignore
  package.json
  README.md
```

## Backend API

### Auth Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`

### User Routes

- `GET /api/users/profile` (protected)
- `PUT /api/users/profile` (protected)
- `GET /api/users/matches` (protected)
- `POST /api/users/connect/:userId` (protected)
- `GET /api/users/:userId/reviews` (protected)
- `POST /api/users/:userId/reviews` (protected)
- `GET /api/users` (protected)

### Chat Routes

- `POST /api/chat/message` (protected)
- `GET /api/chat/:userId` (protected)

### Call Routes (WebRTC Signaling)

- `POST /api/call/signal` (protected)
- `GET /api/call/signals/:userId` (protected)

## Setup Instructions

### 1. Install dependencies

From the project root:

```bash
npm install
npm run install:all
```

### 2. Configure environment variables

Copy these example files:

- `server/.env.example` to `server/.env`
- `client/.env.example` to `client/.env`

Update values as needed (especially `MONGO_URI` and `JWT_SECRET`).

### 3. Run both frontend and backend

From the project root:

```bash
npm run dev
```

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`

## Key Features Included

- JWT auth with password hashing via bcrypt
- Protected profile and chat routes
- Persistent user-to-user connection flow
- Profile view and update
- List all users except logged-in user
- One-to-one chat stored in MongoDB
- WebRTC-based video calling from chat (polling-based signaling)
- Ratings and reviews per user profile (for connected/chatted users)
- Matchmaking algorithm based on skill-interest overlap and rating similarity
- Auto-seeded default user profiles for faster demo setup
- Theme switcher with persistent dark/light mode
- Smart dashboard controls (search, sort, connected-only filter, quick stats)
- Enhanced call UX (incoming call ring tone, auto-timeout, call timer, mic/camera toggles)
- Clean responsive UI for landing, auth, dashboard, and chat
- Loading spinner, success/error alerts, and empty states

## Notes

- This is an academic MVP and intentionally avoids advanced features like real-time sockets, notifications, and admin tooling.
- Chat refresh is fetch-based and auto-updates periodically.
- Video calls use browser WebRTC with backend signaling endpoints.

## Seeded Demo Profiles

On server start, default users are seeded automatically if they do not already exist.

- Example login emails:  
  `aarav.sharma@skillswap.dev`, `neha.verma@skillswap.dev`, `rohan.iyer@skillswap.dev`, `sana.khan@skillswap.dev`, `vikram.nair@skillswap.dev`
- Default password for seeded users: `Pass@123`

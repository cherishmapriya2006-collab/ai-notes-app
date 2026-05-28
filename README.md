# 🔐 Secure Glow Pad — MERN Stack

A full-stack, production-ready AI-powered notes app built with the **MERN** stack.
Features JWT auth, AES-256 encrypted notes, a rich TipTap editor, image uploads,
AI summarization/title generation, dark mode, and a premium glassmorphism UI.

> ✅ Pure MERN. No proprietary services. Runs locally with `npm install && npm run dev`.

---

## 📁 Folder Structure

```
glow-pad/
├── client/                  # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── pages/           # Login, Signup, Dashboard
│   │   ├── components/      # Sidebar, NoteCard, Editor, etc.
│   │   ├── context/         # AuthContext
│   │   ├── utils/           # axios instance
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
│
├── server/                  # Node + Express + MongoDB backend
│   ├── config/              # db connection
│   ├── controllers/         # auth, notes, ai, upload
│   ├── middleware/          # auth, error
│   ├── models/              # User, Note
│   ├── routes/              # auth, notes, ai, upload
│   ├── utils/               # encryption (AES-256)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Quick Start (Local VS Code)

### 1. Clone & install

```bash
git clone <your-repo-url> glow-pad
cd glow-pad

# install backend
cd server && npm install

# install frontend
cd ../client && npm install
```

### 2. MongoDB Atlas setup

1. Go to https://www.mongodb.com/cloud/atlas → create a free M0 cluster.
2. Database Access → add a user (username + password).
3. Network Access → allow `0.0.0.0/0` (or your IP).
4. Connect → "Drivers" → copy the connection string, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/ainotes?retryWrites=true&w=majority`

### 3. Environment variables

**`server/.env`** (copy from `.env.example`):
```
PORT=5000
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/ainotes
JWT_SECRET=replace_with_long_random_string
ENCRYPTION_KEY=replace_with_32_char_random_string_here
CLIENT_URL=http://localhost:5173

# Optional integrations
OPENAI_API_KEY=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**`client/.env`**:
```
VITE_API_URL=http://localhost:5000/api
```

### 4. Run dev servers

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Frontend → http://localhost:5173
Backend  → http://localhost:5000

---

## 🔌 API Routes

| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| POST   | `/api/auth/signup`        | Create account        |
| POST   | `/api/auth/login`         | Login, returns JWT    |
| GET    | `/api/notes`              | List user notes       |
| POST   | `/api/notes`              | Create note           |
| PUT    | `/api/notes/:id`          | Update note           |
| DELETE | `/api/notes/:id`          | Delete (trash) note   |
| POST   | `/api/ai/summarize`       | AI summary            |
| POST   | `/api/ai/title`           | AI title generation   |
| POST   | `/api/ai/keywords`        | Extract keywords      |
| POST   | `/api/upload`             | Upload image          |

All `/api/notes` and `/api/ai` routes require `Authorization: Bearer <token>`.

---

## ☁️ Deployment

### Backend → Render
1. Push repo to GitHub.
2. Render → New → Web Service → connect repo → root dir `server`.
3. Build: `npm install` · Start: `npm start`.
4. Add env vars from `server/.env`.
5. Note your URL, e.g. `https://glow-pad-api.onrender.com`.

### Frontend → Vercel
1. Vercel → New Project → import repo → root dir `client`.
2. Framework: Vite. Build: `npm run build`. Output: `dist`.
3. Env: `VITE_API_URL=https://glow-pad-api.onrender.com/api`.
4. Deploy.

Update `CLIENT_URL` on Render to your Vercel URL for CORS.

---

## 🛡️ Security Notes
- Passwords hashed with **bcryptjs** (10 rounds).
- Note content encrypted with **AES-256 (CryptoJS)** before persisting to MongoDB.
- JWT stored client-side in `localStorage`; sent via `Authorization` header.
- Auth middleware guards all private routes.

---

## 🧠 AI Integration
The `/api/ai/*` controllers ship as **provider-agnostic placeholders** with
ready-to-use OpenAI and Gemini call sites — drop your key into `.env` and
uncomment the relevant block.

---

Made with ❤️ — placement-worthy MERN project.

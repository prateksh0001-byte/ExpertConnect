# Deploy ExpertConnect to Vercel

The **frontend** (React + Vite) deploys to Vercel. The **backend** (Node + Express + Socket.io + MongoDB) must be hosted elsewhere (e.g. Railway, Render), then you point the frontend to it.

---

## 1. Deploy the backend first (Railway / Render / etc.)

Your API and Socket.io server need a public URL. Example with **Railway**:

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select `expert_booking_system`.
3. Set **Root Directory** to `backend` (or only deploy the backend folder).
4. Add **Variables**: `MONGODB_URI`, `CLIENT_URL` (your Vercel frontend URL, e.g. `https://expert-booking.vercel.app`), `NODE_ENV=production`.
5. Deploy and copy the public URL (e.g. `https://expert-booking-api-production.up.railway.app`).

You'll use this URL as `VITE_BACKEND_URL` in the next step.

---

## 2. Deploy the frontend to Vercel

### Option A: Vercel dashboard (recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import `xouvik09/expert_booking_system`.
3. **Configure:**
   - **Root Directory:** click **Edit**, set to `frontend`, then **Continue**.
   - **Framework Preset:** Vite (auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
4. **Environment Variables:** add:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** your backend URL from step 1 (e.g. `https://expert-booking-api-production.up.railway.app`)
   - No trailing slash.
5. Click **Deploy**. When it's done, open the Vercel URL (e.g. `https://expert-booking-xxx.vercel.app`).

### Option B: Vercel CLI

```bash
cd frontend
npm i -g vercel
vercel
```

When prompted, set **Root Directory** to `.` (you're already in `frontend`). Then add the env var in the Vercel dashboard: **Project → Settings → Environment Variables** → `VITE_BACKEND_URL` = your backend URL.

---

## 3. Point backend at the frontend (CORS)

On your backend host (Railway/Render), set:

- **CLIENT_URL** = your Vercel frontend URL (e.g. `https://expert-booking-xxx.vercel.app`).

Redeploy the backend after changing env vars so CORS and Socket.io allow the Vercel origin.

---

## Checklist

| Step | Where | What |
|------|--------|------|
| 1 | Railway / Render | Deploy backend, get URL, set `MONGODB_URI`, `CLIENT_URL`, `NODE_ENV` |
| 2 | Vercel | Import repo, Root Directory = `frontend`, add `VITE_BACKEND_URL` = backend URL |
| 3 | Backend host | Set `CLIENT_URL` = Vercel frontend URL, redeploy |

After that, the Vercel site will call your backend for API and Socket.io; real-time updates will work as long as your backend URL is correct and CORS is set via `CLIENT_URL`.

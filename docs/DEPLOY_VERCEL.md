# Deploy ExpertConnect to Vercel

This repository's Vercel configuration deploys the **frontend** (React + Vite). Host the **backend** (Node + Express + Socket.io + MongoDB) on a Node service such as Railway or Render, then point the frontend at it.

---

## 1. Deploy the backend first (Railway / Render / etc.)

Your API and Socket.io server need a public URL. Example with **Railway**:

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select `prateksh0001-byte/ExpertConnect`.
3. Set **Root Directory** to `backend`.
4. Add **Variables**: `MONGODB_URI`, `CLIENT_URL` (your Vercel frontend URL, e.g. `https://expert-booking.vercel.app`), `NODE_ENV=production`.
5. Deploy and copy the public URL (e.g. `https://expert-booking-api-production.up.railway.app`).

You'll use this URL as `VITE_BACKEND_URL` in the next step.

---

## 2. Deploy the frontend to Vercel

### Option A: Vercel dashboard (recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import `prateksh0001-byte/ExpertConnect`.
3. **Configure:**
   - **Root Directory:** leave it at the repository root.
   - **Framework Preset:** Other (the checked-in `vercel.json` supplies the build settings).
   - **Build Command:** `npm --prefix frontend run build`.
   - **Install Command:** `npm ci --prefix frontend`.
   - **Output Directory:** `frontend/dist`.
4. **Environment Variables:** add:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** your backend URL from step 1 (e.g. `https://expert-booking-api-production.up.railway.app`)
   - No trailing slash.
5. Click **Deploy**. When it's done, open the Vercel URL (e.g. `https://expert-booking-xxx.vercel.app`).

### Option B: Vercel CLI

```bash
npx vercel
```

Run it from the repository root. The checked-in `vercel.json` builds the frontend. Add `VITE_BACKEND_URL` in **Project → Settings → Environment Variables** and redeploy.

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
| 2 | Vercel | Import repo at root, add `VITE_BACKEND_URL` = backend URL |
| 3 | Backend host | Set `CLIENT_URL` = Vercel frontend URL, redeploy |

After that, the Vercel site will call your backend for API and Socket.io; real-time updates will work as long as your backend URL is correct and CORS is set via `CLIENT_URL`.

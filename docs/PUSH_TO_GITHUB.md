# Push This Project to GitHub (expert_booking_system)

Your repo is ready to push. **Sensitive data is already protected**: `.env`, `node_modules/`, and other secrets are in `.gitignore` and were **not** committed.

---

## Option A: Using GitHub CLI (recommended)

1. **Log in to GitHub** (one-time):
   ```powershell
   gh auth login
   ```
   Follow the prompts (browser or token). Use your GitHub account.

2. **Create the repo and push** (from project root):
   ```powershell
   cd "C:\Users\souvi\OneDrive\Desktop\expert-booking"
   gh repo create expert_booking_system --public --source=. --remote=origin --push
   ```
   This creates **expert_booking_system** on your GitHub and pushes your code.

---

## Option B: Create repo on GitHub, then push

1. Go to **https://github.com/new**
2. Set **Repository name** to: `expert_booking_system`
3. Choose **Public**
4. **Do not** add a README, .gitignore, or license (you already have them)
5. Click **Create repository**

6. In your project folder, run (replace `YOUR_USERNAME` with your GitHub username):
   ```powershell
   cd "C:\Users\souvi\OneDrive\Desktop\expert-booking"
   git remote add origin https://github.com/YOUR_USERNAME/expert_booking_system.git
   git branch -M main
   git push -u origin main
   ```
   If you prefer to keep the branch name `master`:
   ```powershell
   git push -u origin master
   ```

---

## What was kept safe (not pushed)

- `backend/.env` – ignored
- `frontend/.env` – ignored  
- `node_modules/` – ignored
- Any file matching `.env*` (except `.env.example`) – ignored

Only **`.env.example`** (template with no real secrets) is in the repo. After cloning, copy it to `.env` and add your real values locally.

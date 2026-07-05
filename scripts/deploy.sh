#!/usr/bin/env bash
# Marqai — one-shot deploy helper
# Run this from your local clone to push to GitHub and deploy to Vercel.
set -e

REMOTE_URL="https://github.com/pmkshar/marqaitools.git"
BRANCH="main"

echo "============================================"
echo "  Marqai — deploy helper"
echo "============================================"

# --- 1. Check git remote ---
echo ""
echo "[1/4] Checking git remote..."
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi
echo "  origin -> $(git remote get-url origin)"

# --- 2. Stage + commit (if anything changed) ---
echo ""
echo "[2/4] Staging changes..."
git add -A
if git diff --cached --quiet; then
  echo "  No new changes to commit."
else
  git commit -m "chore: deploy update $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
fi

# --- 3. Push to GitHub ---
echo ""
echo "[3/4] Pushing to GitHub ($BRANCH)..."
echo "  If this is your first push, GitHub will ask for credentials."
echo "  Use a Personal Access Token (PAT) as the password."
echo "  Create one at: https://github.com/settings/tokens (scope: repo)"
echo ""
git push -u origin "$BRANCH"

# --- 4. Vercel deploy hint ---
echo ""
echo "[4/4] Deploy to Vercel"
echo "  Option A (recommended for first deploy):"
echo "    1. Open https://vercel.com/new"
echo "    2. Import the GitHub repo: pmkshar/marqaitools"
echo "    3. Add env var: ZAI_API_KEY=<your-key>"
echo "    4. Click Deploy"
echo ""
echo "  Option B (CLI):"
echo "    npm i -g vercel"
echo "    vercel link         # one-time, links this folder to a Vercel project"
echo "    vercel env add ZAI_API_KEY"
echo "    vercel --prod       # deploy to production"
echo ""
echo "============================================"
echo "  Done. Your Marqai app will be live at a *.vercel.app URL."
echo "============================================"

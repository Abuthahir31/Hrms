# .gitignore Setup Guide

## Overview
A comprehensive `.gitignore` file has been created for your HRMS project to prevent sensitive files, build artifacts, and unnecessary files from being committed to Git.

## Critical Files Protected

### 🔒 Sensitive & Secret Files
- ✅ `scripts/serviceAccountKey.json` - Firebase Admin SDK credentials
- ✅ `.env` files (root and functions folder)
- ✅ `functions/.env.yaml` - Firebase environment config
- ✅ All `**/serviceAccountKey.json` files
- ✅ API keys and `.key` files

### 📦 Dependencies
- ✅ `node_modules/` (root)
- ✅ `functions/node_modules/`

### 🏗️ Build & Production
- ✅ `/build` folder
- ✅ `/dist` folder

### 🔧 IDE & Editor Files
- ✅ `.vscode/` (except extensions.json and settings.json)
- ✅ `.idea/` (JetBrains)
- ✅ Sublime, Vim swap files

### 💻 OS-Specific Files
- ✅ `.DS_Store` (macOS)
- ✅ `Thumbs.db` (Windows)
- ✅ Linux temporary files

## What's Still Tracked (Intentionally)

✅ `.env.example` - Template file (no secrets)  
✅ `README.md` - Documentation  
✅ `package.json` - Dependencies list  
✅ Source code in `/src`  
✅ Firebase configuration files  

## If You've Already Committed Sensitive Files

If you accidentally committed sensitive files before, you need to remove them from Git history:

### Remove a specific file from Git (keep local copy):
```bash
git rm --cached scripts/serviceAccountKey.json
git commit -m "Remove sensitive file from tracking"
```

### Remove .env files:
```bash
git rm --cached .env
git rm --cached functions/.env
git rm --cached functions/.env.yaml
git commit -m "Remove environment files from tracking"
```

### Remove from entire Git history (ADVANCED):
```bash
# Install BFG Repo-Cleaner or use git filter-branch
# WARNING: This rewrites history!

# Using BFG (recommended)
bfg --delete-files serviceAccountKey.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Verify What's Ignored

Check if files are properly ignored:
```bash
# See what's being tracked
git ls-files

# Check if a specific file is ignored
git check-ignore -v scripts/serviceAccountKey.json

# See all ignored files
git status --ignored
```

## Best Practices

1. **Never commit secrets**: Always use `.env` files and `.gitignore`
2. **Use .env.example**: Create template files without actual values
3. **Review before commit**: Always check `git status` before committing
4. **Keep .gitignore updated**: Add new patterns as needed

## Emergency: Leaked Secrets

If you accidentally pushed secrets to GitHub:

1. **Immediately rotate/revoke** the exposed credentials
2. **Remove from Git history** using the commands above
3. **Force push** (if safe): `git push --force`
4. **Update secrets** in Firebase, Brevo, etc.

## Files Currently Protected

```
✅ .env
✅ functions/.env
✅ functions/.env.yaml
✅ scripts/serviceAccountKey.json
✅ node_modules/
✅ build/
✅ .vercel/
✅ *.log files
✅ IDE config files
✅ OS-specific files
```

## Need to Add More?

Edit `.gitignore` and add patterns:
```bash
# Example: Ignore all .pdf files
*.pdf

# Example: Ignore a specific folder
temp/

# Example: Ignore all files in a folder except one
folder/*
!folder/keep-this-file.txt
```

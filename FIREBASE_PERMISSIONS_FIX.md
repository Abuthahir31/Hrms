# Firebase Storage Permission Error - Quick Fix Guide

## The Problem

You're getting a **403 Unauthorized** error because Firebase Storage has restrictive security rules that prevent file uploads.

## Quick Fix (Manual - 2 minutes)

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **hrms-b353d**

### Step 2: Update Storage Rules

1. Click **Storage** in the left sidebar
2. Click the **Rules** tab at the top
3. Replace the existing rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click **Publish**

### Step 3: Update Firestore Rules (Optional but Recommended)

1. Click **Firestore Database** in the left sidebar
2. Click the **Rules** tab
3. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /job_applications/{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click **Publish**

### Step 4: Test Again

- Go back to your application
- Try submitting a job application
- It should work now! ✅

---

## What These Rules Do

- **Storage Rules**: Allow anyone to upload and read files in the `resumes/` folder
- **Firestore Rules**: Allow anyone to read and write job applications

> [!WARNING]
> These rules are permissive and suitable for development/testing. For production, you should add proper authentication checks.

---

## Production-Ready Rules (Future)

When you add authentication, update the rules to:

```javascript
// Storage - Only authenticated users can upload
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

```javascript
// Firestore - Only authenticated users can write
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /job_applications/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Alternative: Use Firebase CLI (Advanced)

If you have Firebase CLI installed:

```bash
# Deploy the rules files
firebase deploy --only storage
firebase deploy --only firestore
```

The rule files are already created in your project:
- `storage.rules`
- `firestore.rules`

# Firebase & Brevo Setup Guide

## Environment Variables Setup

Create a `.env` file in the root directory (`e:\work 2\hrms-optimized\.env`) with the following variables:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Brevo API Configuration (for email confirmations)
REACT_APP_BREVO_API_KEY=your_brevo_api_key_here
```

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Click on the **Web app** icon or create a new web app
6. Copy the configuration values to your `.env` file

## Getting Brevo API Key (Free Tier)

1. Go to [Brevo](https://www.brevo.com/) (formerly Sendinblue)
2. Sign up for a **free account** (300 emails/day limit)
3. Go to **Settings** → **SMTP & API**
4. Click **Create a new API key**
5. Copy the API key to your `.env` file

## Firebase Setup

### Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location
5. Click **Enable**

### Enable Storage

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode** (for development)
4. Click **Done**

### Security Rules (Optional - for production)

Update Firestore rules to allow writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /job_applications/{document=**} {
      allow read, write: if true; // Change this for production
    }
  }
}
```

Update Storage rules to allow uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{allPaths=**} {
      allow read, write: if true; // Change this for production
    }
  }
}
```

## Brevo Email Configuration

### Verify Sender Email (Important!)

1. Go to **Senders** in Brevo dashboard
2. Add and verify your sender email address
3. Update `applicationService.js` line 79-80 with your verified email:

```javascript
sender: {
    name: 'Your Company Name',
    email: 'your-verified-email@domain.com' // Must be verified in Brevo
}
```

## Testing the Setup

After setting up environment variables:

1. **Restart the development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm start
   ```

2. **Test Firebase Connection**:
   - Open browser console (F12)
   - Look for any Firebase errors
   - If configured correctly, you'll see no errors

3. **Test Application Submission**:
   - Fill out a job application
   - Upload a resume
   - Submit the form
   - Check Firebase Console → Firestore for the new document
   - Check Firebase Console → Storage for the uploaded resume
   - Check your email for the confirmation

## Troubleshooting

### Firebase Errors

- **"Firebase: Error (auth/invalid-api-key)"**: Check your API key in `.env`
- **"Firebase: Missing or insufficient permissions"**: Update Firestore security rules
- **Resume upload fails**: Check Storage is enabled and rules allow writes

### Brevo Email Errors

- **"Sender email not verified"**: Verify your sender email in Brevo dashboard
- **"Invalid API key"**: Check your Brevo API key in `.env`
- **Emails not received**: Check spam folder, verify daily limit (300 emails/day on free tier)

### General Issues

- **Environment variables not loading**: Restart the development server after creating/editing `.env`
- **`.env` file not found**: Ensure it's in the root directory, not in `src/`
- **Still not working**: Check browser console for detailed error messages

## Free Tier Limits

### Firebase (Spark Plan - Free)
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Storage**: 5 GB storage, 1 GB/day downloads

### Brevo (Free Plan)
- **Emails**: 300 emails/day
- **Contacts**: Unlimited

Both are sufficient for development and small-scale production use.

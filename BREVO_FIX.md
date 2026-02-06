# Brevo Email Configuration Fix

## Problem
Your Firebase Cloud Functions are deployed but can't access `BREVO_API_KEY` because environment variables aren't set in Firebase.

## Solution

### Step 1: Set Environment Variables in Firebase

Run these commands in your terminal:

```bash
# Set Brevo API Key
firebase functions:secrets:set BREVO_API_KEY

# When prompted, paste your Brevo API key

# Set Sender Email
firebase functions:secrets:set SENDER_EMAIL

# When prompted, enter: no-reply@yourdomain.com (or your verified sender email)
```

### Step 2: Update functions/index.js to Use Secrets

Replace the environment variable loading at the top of your file:

```javascript
// OLD (doesn't work in deployed functions)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "no-reply@yourdomain.com";

// NEW (works with Firebase secrets)
const { defineSecret } = require('firebase-functions/params');

const brevoApiKey = defineSecret('BREVO_API_KEY');
const senderEmail = defineSecret('SENDER_EMAIL');
```

Then update each function to use the secrets:

```javascript
exports.sendConfirmationEmail = onCall(
  {
    region: "us-central1",
    cors: true,
    secrets: [brevoApiKey, senderEmail], // Add this line
  },
  async (request) => {
    const BREVO_API_KEY = brevoApiKey.value();
    const SENDER_EMAIL = senderEmail.value();
    
    // Rest of your code...
  }
);
```

### Step 3: Redeploy Functions

```bash
firebase deploy --only functions
```

## Alternative: Use .env.yaml (Simpler but Less Secure)

If you prefer a simpler approach:

1. Create `.env.yaml` in your `functions` folder:
```yaml
BREVO_API_KEY: "your-api-key-here"
SENDER_EMAIL: "no-reply@yourdomain.com"
```

2. Deploy with:
```bash
firebase functions:config:set brevo.api_key="your-api-key" brevo.sender_email="your-email"
firebase deploy --only functions
```

3. Update code to use:
```javascript
const BREVO_API_KEY = functions.config().brevo.api_key;
const SENDER_EMAIL = functions.config().brevo.sender_email;
```

## Why This Fixes the IP Blocking Issue

The IP blocking happens because:
1. Your API key isn't being sent correctly (it's undefined in deployed functions)
2. Brevo sees requests without valid API keys
3. Brevo blocks the IP as a security measure

Once you set the environment variables properly, your API key will be sent with every request, and Brevo will accept them!

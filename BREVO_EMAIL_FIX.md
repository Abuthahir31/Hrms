# 🔧 Brevo Email - Complete Fix Guide

## The Real Problem

The **401 Unauthorized** error from Brevo is caused by:
**The sender email `noreply@hrmsportal.com` is NOT verified in your Brevo account.**

Brevo requires ALL sender emails to be verified before you can send emails from them.

---

## ✅ Complete Solution (5 minutes)

### Step 1: Verify YOUR Email in Brevo

1. **Go to [Brevo Dashboard](https://app.brevo.com/)**
2. **Click Settings (gear icon) → Senders**
3. **Click "Add a new sender"**
4. **Enter YOUR email** (e.g., `yourname@gmail.com` or your company email)
5. **Click "Add"**
6. **Check your email inbox** for verification email from Brevo
7. **Click the verification link** in the email
8. **Wait for "Verified" status** in Brevo dashboard

### Step 2: Update the Code

Open `src/services/applicationService.js` and find line 77-80:

**Change FROM:**
```javascript
sender: {
    name: 'HRMS Portal',
    email: 'noreply@hrmsportal.com'  // ❌ NOT verified
}
```

**Change TO:**
```javascript
sender: {
    name: 'HRMS Portal',
    email: 'your-verified-email@gmail.com'  // ✅ Use YOUR verified email
}
```

### Step 3: Test Again

1. Save the file (the dev server will auto-reload)
2. Submit a job application
3. Check browser console for detailed logs
4. You should see: `✅ Email sent successfully!`
5. Check your applicant's email inbox

---

## 📋 Quick Checklist

- [ ] Brevo account created
- [ ] New API key generated and added to `.env`
- [ ] YOUR email added to Brevo Senders
- [ ] Email verification link clicked
- [ ] Email shows "Verified" status in Brevo
- [ ] `applicationService.js` updated with YOUR verified email
- [ ] Dev server reloaded
- [ ] Test application submitted

---

## 🔍 Debugging

After updating the code, check the browser console when submitting an application. You'll see detailed logs:

```
🔄 Attempting to send email via Brevo...
📧 Recipient: applicant@email.com
🔑 API Key: xkeysib-dcd9d3677ba...
📤 Sending email payload: {...}
✅ Email sent successfully! { messageId: '...' }
```

If you still see errors, the console will show:
```
🚨 BREVO AUTHENTICATION ERROR (401)

Possible causes:
1. Invalid API Key
2. Sender email not verified
```

---

## Alternative: Use Gmail Directly

If you want to use `noreply@hrmsportal.com`:

1. You must **own the domain** `hrmsportal.com`
2. Go to Brevo → Settings → Senders
3. Add `noreply@hrmsportal.com`
4. Brevo will ask you to verify domain ownership (DNS records)
5. Follow Brevo's instructions to add DNS records
6. Wait for verification (can take 24-48 hours)

**Easier option:** Just use your Gmail/personal email for now!

---

## 🎯 Expected Result

After fixing:
- ✅ Application submits successfully
- ✅ Resume uploads to Firebase
- ✅ Data saves to Firestore
- ✅ **Email confirmation sent to applicant**
- ✅ Console shows: `✅ Email sent successfully!`

---

## Need Help?

Check the browser console for detailed error messages. The updated code now provides:
- API key validation
- Sender email verification status
- Detailed error responses from Brevo
- Step-by-step solutions

**Most common fix:** Use YOUR verified email address instead of `noreply@hrmsportal.com`

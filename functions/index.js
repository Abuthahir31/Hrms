const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const crypto = require("crypto");

// Load .env file for local development only
if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Environment variables - works in both local and deployed environments
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "myeiokln@gmail.com";

// 📧 Send Confirmation Email (Application Received)
exports.sendConfirmationEmail = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    try {
      const { email, applicantName, jobTitle } = request.data;

      if (!email || !applicantName || !jobTitle) {
        throw new HttpsError(
          "invalid-argument",
          "Missing required fields: email, applicantName, jobTitle"
        );
      }

      if (!BREVO_API_KEY) {
        console.error("❌ BREVO_API_KEY missing");
        throw new HttpsError("internal", "Email service configuration error");
      }

      console.log(`📧 Sending confirmation email to ${email}`);

      const emailPayload = {
        sender: {
          name: "Hitachi Construction Machinery Zambia Co .Ltd",
          email: SENDER_EMAIL,
        },
        to: [{ email, name: applicantName }],
        subject: `Application Received - ${jobTitle}`,
        htmlContent: `
          <html>
            <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
              <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:10px 10px 0 0;text-align:center">
                <h1 style="color:white;margin:0;font-size:28px">Hitachi Construction Machinery Zambia Co .Ltd</h1>
                <p style="color:#f0f0f0;margin:10px 0 0 0">Application Received</p>
              </div>
              
              <div style="background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                <h2 style="color:#667eea;margin-top:0">Application Received!</h2>
                <p style="color:#666;font-size:16px;line-height:1.6">Dear <strong>${applicantName}</strong>,</p>
                <p style="color:#666;font-size:16px;line-height:1.6">
                  Thank you for applying for the position of <strong style="color:#667eea">${jobTitle}</strong>.
                </p>
                <p style="color:#666;font-size:16px;line-height:1.6">
                  Our recruitment team will review your application and contact you soon.
                </p>
                <p style="color:#666;font-size:16px;line-height:1.6;margin-top:30px">
                  Best regards,<br/>
                  <strong style="color:#667eea">Hitachi Construction Machinery Zambia Co .Ltd Recruitment Team</strong>
                </p>
                <hr style="border:none;border-top:1px solid #ddd;margin:30px 0"/>
                <p style="color:#999;font-size:12px;text-align:center;margin:0">
                  This is an automated email from Hitachi Construction Machinery Zambia Co .Ltd. Please do not reply.
                </p>
              </div>
            </body>
          </html>
        `,
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Brevo API error:");
        console.error("Status:", response.status);
        console.error("Status Text:", response.statusText);
        console.error("Response:", JSON.stringify(result, null, 2));
        console.error("Headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

        // Check for specific error types
        if (response.status === 429) {
          throw new HttpsError("resource-exhausted", "Rate limit exceeded. Please try again later.", result);
        } else if (response.status === 401 || response.status === 403) {
          throw new HttpsError("permission-denied", "API key authentication failed or IP blocked.", result);
        }

        throw new HttpsError("internal", `Failed to send email: ${result.message || 'Unknown error'}`, result);
      }

      console.log("✅ Email sent successfully:", result.messageId);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("🔥 sendConfirmationEmail error:", error);
      throw error instanceof HttpsError
        ? error
        : new HttpsError("internal", "Unexpected error");
    }
  }
);

// 🔐 Generate and send OTP for email verification
exports.sendVerificationOTP = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    try {
      const { email, password } = request.data;

      if (!email || !password) {
        throw new HttpsError(
          "invalid-argument",
          "Missing required fields: email, password"
        );
      }

      if (!BREVO_API_KEY) {
        throw new HttpsError("internal", "Email service configuration error");
      }

      console.log(`🔐 Generating OTP for ${email}`);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

      const db = admin.firestore();
      const expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 10 * 60 * 1000)
      );

      await db.collection("pending_verifications").doc(email).set({
        email,
        otpHash,
        passwordHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
        attempts: 0,
      });

      console.log(`💾 OTP stored for ${email}, expires at ${expiresAt.toDate()}`);

      const emailPayload = {
        sender: { name: "Hitachi Construction Machinery Zambia Co .Ltd", email: SENDER_EMAIL },
        to: [{ email }],
        subject: "Your Hitachi Construction Machinery Zambia Co .Ltd Verification Code",
        htmlContent: `
          <html>
            <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
              <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:10px 10px 0 0;text-align:center">
                <h1 style="color:white;margin:0;font-size:28px">Hitachi Construction Machinery Zambia Co .Ltd</h1>
                <p style="color:#f0f0f0;margin:10px 0 0 0">Email Verification</p>
              </div>
              
              <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px">
                <h2 style="color:#333;margin-top:0">Welcome to Hitachi Construction Machinery Zambia Co .Ltd!</h2>
                <p style="color:#666;font-size:16px;line-height:1.6">
                  Thank you for signing up. Please use the verification code below to complete your registration:
                </p>
                
                <div style="background:white;border:2px dashed #667eea;border-radius:8px;padding:20px;margin:30px 0;text-align:center">
                  <p style="color:#999;font-size:14px;margin:0 0 10px 0">Your Verification Code</p>
                  <h1 style="color:#667eea;font-size:42px;letter-spacing:8px;margin:0;font-family:monospace">${otp}</h1>
                </div>
                
                <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px">
                  <p style="margin:0;color:#856404;font-size:14px">
                    ⏱️ <strong>This code will expire in 10 minutes.</strong>
                  </p>
                </div>
                
                <p style="color:#666;font-size:14px;line-height:1.6">
                  If you didn't request this code, please ignore this email. Your account will not be created without verification.
                </p>
                
                <hr style="border:none;border-top:1px solid #ddd;margin:30px 0"/>
                
                <p style="color:#999;font-size:12px;text-align:center;margin:0">
                  This is an automated email from Hitachi Construction Machinery Zambia Co .Ltd. Please do not reply.
                </p>
              </div>
            </body>
          </html>
        `,
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Brevo API error:", result);
        throw new HttpsError("internal", "Failed to send OTP email", result);
      }

      console.log(`✅ OTP email sent to ${email}:`, result.messageId);

      return {
        success: true,
        message: "Verification code sent to your email",
        expiresIn: 600,
      };
    } catch (error) {
      console.error("🔥 sendVerificationOTP error:", error);
      throw error instanceof HttpsError
        ? error
        : new HttpsError("internal", "Unexpected error");
    }
  }
);

// ✅ Verify OTP and create Firebase account
exports.verifyOTP = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    try {
      const { email, otp, password } = request.data;

      if (!email || !otp || !password) {
        throw new HttpsError(
          "invalid-argument",
          "Missing required fields: email, otp, password"
        );
      }

      console.log(`🔍 Verifying OTP for ${email}`);

      const db = admin.firestore();
      const pendingDoc = await db
        .collection("pending_verifications")
        .doc(email)
        .get();

      if (!pendingDoc.exists) {
        throw new HttpsError(
          "not-found",
          "No verification request found. Please sign up again."
        );
      }

      const pendingData = pendingDoc.data();

      if (pendingData.expiresAt.toDate() < new Date()) {
        await pendingDoc.ref.delete();
        throw new HttpsError(
          "deadline-exceeded",
          "Verification code has expired. Please request a new one."
        );
      }

      if (pendingData.attempts >= 3) {
        await pendingDoc.ref.delete();
        throw new HttpsError(
          "resource-exhausted",
          "Too many failed attempts. Please sign up again."
        );
      }

      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

      if (otpHash !== pendingData.otpHash) {
        await pendingDoc.ref.update({
          attempts: admin.firestore.FieldValue.increment(1),
        });

        const remainingAttempts = 3 - (pendingData.attempts + 1);
        throw new HttpsError(
          "invalid-argument",
          `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
        );
      }

      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
      if (passwordHash !== pendingData.passwordHash) {
        throw new HttpsError(
          "invalid-argument",
          "Password does not match. Please use the same password you entered during signup."
        );
      }

      console.log(`✅ OTP verified for ${email}, creating Firebase account...`);

      let userRecord;
      try {
        userRecord = await admin.auth().createUser({
          email,
          password,
          emailVerified: true,
        });
      } catch (authError) {
        if (authError.code === "auth/email-already-exists") {
          throw new HttpsError(
            "already-exists",
            "This email is already registered. Please sign in instead."
          );
        }
        throw authError;
      }

      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: "",
        role: "user",
        emailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await pendingDoc.ref.delete();

      console.log(`🎉 Account created successfully for ${email}`);

      return {
        success: true,
        message: "Email verified successfully! You can now sign in.",
        uid: userRecord.uid,
      };
    } catch (error) {
      console.error("🔥 verifyOTP error:", error);
      throw error instanceof HttpsError
        ? error
        : new HttpsError("internal", "Unexpected error");
    }
  }
);

// 📨 Send Application Status Update Email
exports.sendApplicationUpdateEmail = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    try {
      const { email, applicantName, jobTitle, status, additionalData } = request.data;

      if (!email || !applicantName || !status) {
        throw new HttpsError("invalid-argument", "Missing required fields");
      }

      if (!BREVO_API_KEY) {
        throw new HttpsError("internal", "Email configuration missing");
      }

      console.log(`📧 Sending ${status} email to ${email}`);

      let subject = "";
      let htmlContent = "";

      switch (status) {
        case "shortlisted":
          subject = `🎉 Interview Invitation - ${jobTitle}`;
          const { date, time, mode, meetingLink, location } = additionalData?.interview || {};
          htmlContent = `
            <html>
              <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
                <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:30px;border-radius:10px 10px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:28px">🎉 Congratulations!</h1>
                  <p style="color:#f0f0f0;margin:10px 0 0 0;font-size:16px">You've Been Shortlisted</p>
                </div>
                
                <div style="background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                  <h2 style="color:#059669;margin-top:0;font-size:24px">Interview Invitation</h2>
                  <p style="color:#666;font-size:16px;line-height:1.6">Dear <strong>${applicantName}</strong>,</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">
                    We are delighted to inform you that after careful review of all applications, your profile has been shortlisted for the position of <strong style="color:#059669">${jobTitle}</strong>.
                  </p>
                  <p style="color:#666;font-size:16px;line-height:1.6">
                    Your qualifications and experience have impressed our recruitment team, and we would like to invite you for an interview to discuss this opportunity further.
                  </p>
                  
                  <div style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-left:4px solid #10b981;padding:25px;margin:30px 0;border-radius:8px">
                    <h3 style="color:#059669;margin:0 0 20px 0;font-size:20px">📅 Interview Details</h3>
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="padding:10px 0;color:#555;font-size:15px"><strong style="color:#333">📆 Date:</strong></td>
                        <td style="padding:10px 0;color:#333;font-size:15px">${date || 'To be confirmed'}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;color:#555;font-size:15px"><strong style="color:#333">🕐 Time:</strong></td>
                        <td style="padding:10px 0;color:#333;font-size:15px">${time || 'To be confirmed'}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;color:#555;font-size:15px"><strong style="color:#333">💼 Mode:</strong></td>
                        <td style="padding:10px 0;color:#333;font-size:15px">${mode === 'online' ? '🖥️ Online Video Interview' : '🏢 In-Person Interview'}</td>
                      </tr>
                      ${mode === 'online' && meetingLink ? `
                      <tr>
                        <td style="padding:10px 0;color:#555;font-size:15px"><strong style="color:#333">🔗 Meeting Link:</strong></td>
                        <td style="padding:10px 0"><a href="${meetingLink}" style="color:#10b981;text-decoration:none;font-weight:bold;word-break:break-all">${meetingLink}</a></td>
                      </tr>` : ''}
                      ${mode !== 'online' && location ? `
                      <tr>
                        <td style="padding:10px 0;color:#555;font-size:15px"><strong style="color:#333">📍 Location:</strong></td>
                        <td style="padding:10px 0;color:#333;font-size:15px">${location}</td>
                      </tr>` : ''}
                    </table>
                  </div>

                  <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px">
                    <p style="margin:0;color:#856404;font-size:14px">⚠️ <strong>Important:</strong> Please confirm your availability by replying to this email at least 24 hours before the scheduled interview.</p>
                  </div>

                  <p style="color:#666;font-size:16px;line-height:1.6">If you have any questions or need to reschedule, please don't hesitate to contact us.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">We look forward to meeting you and learning more about your experience!</p>
                  <p style="color:#666;font-size:16px;line-height:1.6;margin-top:30px">Best regards,<br/><strong style="color:#059669">Hitachi Construction Machinery Zambia Co .Ltd Recruitment Team</strong></p>
                  <hr style="border:none;border-top:1px solid #ddd;margin:30px 0"/>
                  <p style="color:#999;font-size:12px;text-align:center;margin:0">This is an automated email from Hitachi Construction Machinery Zambia Co .Ltd. Please do not reply directly to this email for confirmation.</p>
                </div>
              </body>
            </html>
          `;
          break;

        case "rejected":
          subject = `Application Update - ${jobTitle}`;
          htmlContent = `
            <html>
              <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
                <div style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:30px;border-radius:10px 10px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:28px">Hitachi Construction Machinery Zambia Co .Ltd</h1>
                  <p style="color:#f0f0f0;margin:10px 0 0 0;font-size:16px">Application Status Update</p>
                </div>
                <div style="background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                  <h2 style="color:#4f46e5;margin-top:0;font-size:24px">Thank You for Your Application</h2>
                  <p style="color:#666;font-size:16px;line-height:1.6">Dear <strong>${applicantName}</strong>,</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">Thank you for taking the time to apply for the position of <strong style="color:#4f46e5">${jobTitle}</strong> at our organization. We sincerely appreciate your interest in joining our team.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">We have carefully reviewed your application along with your qualifications and experience. After thorough consideration, we regret to inform you that we have decided to move forward with other candidates whose profiles more closely align with our current requirements for this specific role.</p>
                  <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:20px;margin:25px 0;border-radius:8px">
                    <p style="margin:0;color:#475569;font-size:15px;line-height:1.6">💡 <strong>Please note:</strong> This decision does not reflect on your abilities or potential. We received numerous applications from highly qualified candidates, and the selection process was extremely competitive.</p>
                  </div>
                  <p style="color:#666;font-size:16px;line-height:1.6">We were genuinely impressed with your background and credentials. Your resume will be kept in our talent database, and we will reach out to you if a suitable opportunity that matches your profile becomes available in the future.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">We encourage you to continue exploring career opportunities with us by visiting our careers page regularly for new openings that align with your expertise.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">We wish you the very best in your job search and future career endeavors. Thank you once again for considering us as a potential employer.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6;margin-top:30px">Warm regards,<br/><strong style="color:#4f46e5">Hitachi Construction Machinery Zambia Co .Ltd Recruitment Team</strong></p>
                  <hr style="border:none;border-top:1px solid #ddd;margin:30px 0"/>
                  <p style="color:#999;font-size:12px;text-align:center;margin:0">This is an automated email from Hitachi Construction Machinery Zambia Co .Ltd. Please do not reply.</p>
                </div>
              </body>
            </html>
          `;
          break;

        case "on_hold":
          subject = `Application Status - ${jobTitle}`;
          htmlContent = `
            <html>
              <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
                <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:30px;border-radius:10px 10px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:28px">Hitachi Construction Machinery Zambia Co .Ltd</h1>
                  <p style="color:#f0f0f0;margin:10px 0 0 0;font-size:16px">Application Review in Progress</p>
                </div>
                <div style="background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                  <h2 style="color:#d97706;margin-top:0;font-size:24px">Your Application is Under Review</h2>
                  <p style="color:#666;font-size:16px;line-height:1.6">Dear <strong>${applicantName}</strong>,</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">Thank you for your interest in the <strong style="color:#d97706">${jobTitle}</strong> position at our organization. We wanted to provide you with an update on the status of your application.</p>
                  <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border-left:4px solid #f59e0b;padding:25px;margin:30px 0;border-radius:8px">
                    <h3 style="color:#d97706;margin:0 0 15px 0;font-size:20px">⏳ Current Status: Under Review</h3>
                    <p style="margin:0;color:#92400e;font-size:15px;line-height:1.6">We are currently in the process of reviewing a substantial number of applications from highly qualified candidates. To ensure we give each application the attention it deserves, we need a bit more time to complete our evaluation.</p>
                  </div>
                  <p style="color:#666;font-size:16px;line-height:1.6">Your application has been placed <strong>on hold</strong> temporarily while we finalize our review process. This status allows us to:</p>
                  <ul style="color:#666;font-size:15px;line-height:1.8;padding-left:20px">
                    <li>Thoroughly assess all qualified candidates</li>
                    <li>Ensure fair consideration for every applicant</li>
                    <li>Match the best candidate with our team's requirements</li>
                  </ul>
                  <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px">
                    <p style="margin:0;color:#856404;font-size:14px">📧 <strong>What's Next:</strong> We will notify you via email as soon as a decision has been made regarding your application. No action is required from your end at this time.</p>
                  </div>
                  <p style="color:#666;font-size:16px;line-height:1.6">We truly appreciate your patience and understanding during this process. Your interest in joining our team means a lot to us, and we want to ensure we make the right decision for both parties.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">If you have any questions or concerns in the meantime, please feel free to reach out to our recruitment team.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6;margin-top:30px">Thank you for your continued interest,<br/><strong style="color:#d97706">Hitachi Construction Machinery Zambia Co .Ltd Recruitment Team</strong></p>
                  <hr style="border:none;border-top:1px solid #ddd;margin:30px 0"/>
                  <p style="color:#999;font-size:12px;text-align:center;margin:0">This is an automated email from Hitachi Construction Machinery Zambia Co .Ltd. Please do not reply.</p>
                </div>
              </body>
            </html>
          `;
          break;

        case "selected":
          subject = `🎊 Congratulations! Job Offer - ${jobTitle}`;
          htmlContent = `
            <html>
              <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
                <div style="background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:30px;border-radius:10px 10px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:32px">🎊 Congratulations! 🎊</h1>
                  <p style="color:#f0f0f0;margin:10px 0 0 0;font-size:18px">You've Been Selected!</p>
                </div>
                <div style="background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                  <h2 style="color:#7c3aed;margin-top:0;font-size:26px">Welcome to Our Team!</h2>
                  <p style="color:#666;font-size:16px;line-height:1.6">Dear <strong>${applicantName}</strong>,</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">We are absolutely thrilled to extend to you an official offer for the position of <strong style="color:#7c3aed;font-size:18px">${jobTitle}</strong> with our organization!</p>
                  <div style="background:linear-gradient(135deg,#faf5ff 0%,#f3e8ff 100%);border:2px solid #8b5cf6;padding:25px;margin:30px 0;border-radius:10px;text-align:center">
                    <p style="color:#6b21a8;font-size:18px;margin:0;font-weight:bold">🌟 You stood out among many talented candidates! 🌟</p>
                  </div>
                  <p style="color:#666;font-size:16px;line-height:1.6">Throughout the interview process, our team was consistently impressed by:</p>
                  <ul style="color:#666;font-size:15px;line-height:1.8;padding-left:20px">
                    <li><strong>Your exceptional skills</strong> and technical expertise</li>
                    <li><strong>Your professional experience</strong> and proven track record</li>
                    <li><strong>Your enthusiasm</strong> and cultural fit with our team</li>
                    <li><strong>Your problem-solving abilities</strong> and innovative thinking</li>
                  </ul>
                  <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:20px;margin:25px 0;border-radius:8px">
                    <p style="margin:0;color:#1e40af;font-size:15px;line-height:1.6">📋 <strong>Next Steps:</strong> You will receive your official offer letter containing comprehensive details about your employment, including compensation, benefits, start date, and other important information via a separate email within the next 24-48 hours.</p>
                  </div>
                  <p style="color:#666;font-size:16px;line-height:1.6">Please review the offer letter carefully once you receive it. If you have any questions or would like to discuss any aspect of the offer, our HR team will be happy to assist you.</p>
                  <p style="color:#666;font-size:16px;line-height:1.6">We are excited about the prospect of you joining our team and contributing your talents to our organization. We believe you will be a valuable addition and look forward to working with you!</p>
                  <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:15px;margin:20px 0;border-radius:4px">
                    <p style="margin:0;color:#065f46;font-size:14px">💚 <strong>Welcome aboard!</strong> We can't wait to see the amazing contributions you'll make to our team.</p>
                  </div>
                  <p style="color:#666;font-size:16px;line-height:1.6;margin-top:30px">Warmest congratulations,<br/><strong style="color:#7c3aed">Hitachi Construction Machinery Zambia Co .Ltd Recruitment Team</strong></p>
                  <hr style="border:none;border-top:1px solid #ddd;margin:30px 0"/>
                  <p style="color:#999;font-size:12px;text-align:center;margin:0">This is an automated email from Hitachi Construction Machinery Zambia Co .Ltd. For questions about your offer, please contact our HR team.</p>
                </div>
              </body>
            </html>
          `;
          break;

        default:
          throw new HttpsError("invalid-argument", "Invalid status type");
      }

      const emailPayload = {
        sender: { name: "Hitachi Construction Machinery Zambia Co .Ltd", email: SENDER_EMAIL },
        to: [{ email, name: applicantName }],
        subject,
        htmlContent,
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Brevo API error:", errorData);
        throw new HttpsError("internal", "Failed to send email");
      }

      const result = await response.json();
      console.log(`✅ ${status} email sent successfully to ${email}:`, result.messageId);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("🔥 sendApplicationUpdateEmail error:", error);
      throw error instanceof HttpsError
        ? error
        : new HttpsError("internal", "Unexpected error");
    }
  }
);

// 📄 Send Offer Letter Email
exports.sendOfferLetterEmail = onCall(
  {
    region: "us-central1",
    cors: true,
  },
  async (request) => {
    try {
      const { email, candidateName, role, department, salary, joiningDate, location, additionalTerms } = request.data;

      if (!email || !candidateName || !role || !salary || !joiningDate) {
        throw new HttpsError(
          "invalid-argument",
          "Missing required fields: email, candidateName, role, salary, joiningDate"
        );
      }

      if (!BREVO_API_KEY) {
        throw new HttpsError("internal", "Email service configuration error");
      }

      console.log(`📧 Sending offer letter to ${email}`);

      const formattedSalary = parseInt(salary).toLocaleString();
      const formattedDate = new Date(joiningDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailPayload = {
        sender: {
          name: "Hitachi Construction Machinery Zambia Co .Ltd",
          email: SENDER_EMAIL,
        },
        to: [{ email, name: candidateName }],
        subject: `Offer of Employment - ${role}`,
        htmlContent: `
          <html>
            <body style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;padding:20px;background:#f5f5f5">
              <div style="background:white;padding:40px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)">
                <!-- Letterhead -->
                <div style="border-bottom:3px solid #667eea;padding-bottom:20px;margin-bottom:30px">
                  <h1 style="color:#667eea;margin:0;font-size:32px">Hitachi</h1>
                  <p style="color:#666;margin:5px 0 0 0;font-size:14px">Human Resources Department</p>
                </div>

                <!-- Date -->
                <p style="color:#666;font-size:14px;margin-bottom:30px">
                  Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <!-- Recipient -->
                <div style="margin-bottom:30px">
                  <p style="font-weight:bold;color:#333;margin:0">${candidateName}</p>
                  <p style="color:#666;font-size:14px;margin:5px 0 0 0">${email}</p>
                </div>

                <!-- Subject -->
                <p style="font-weight:bold;color:#333;margin-bottom:20px;font-size:16px">Subject: Offer of Employment</p>

                <!-- Body -->
                <div style="color:#555;font-size:15px;line-height:1.8">
                  <p>Dear ${candidateName},</p>
                  
                  <p>
                    We are pleased to offer you the position of <strong style="color:#667eea">${role}</strong> in 
                    the <strong style="color:#667eea">${department || 'designated'}</strong> department at Hitachi.
                  </p>

                  <p>The details of your employment are as follows:</p>

                  <div style="background:#f8f9fa;border-left:4px solid #667eea;padding:20px;margin:25px 0;border-radius:5px">
                    <table style="width:100%;border-collapse:collapse">
                      <tr>
                        <td style="padding:8px 0;color:#666;font-size:14px"><strong style="color:#333">Position:</strong></td>
                        <td style="padding:8px 0;color:#333;font-size:14px">${role}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#666;font-size:14px"><strong style="color:#333">Department:</strong></td>
                        <td style="padding:8px 0;color:#333;font-size:14px">${department || 'To be confirmed'}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#666;font-size:14px"><strong style="color:#333">Annual Salary:</strong></td>
                        <td style="padding:8px 0;color:#333;font-size:14px">₹${formattedSalary}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;color:#666;font-size:14px"><strong style="color:#333">Joining Date:</strong></td>
                        <td style="padding:8px 0;color:#333;font-size:14px">${formattedDate}</td>
                      </tr>
                      ${location ? `
                      <tr>
                        <td style="padding:8px 0;color:#666;font-size:14px"><strong style="color:#333">Work Location:</strong></td>
                        <td style="padding:8px 0;color:#333;font-size:14px">${location}</td>
                      </tr>` : ''}
                    </table>
                  </div>

                  ${additionalTerms ? `
                  <div style="margin:25px 0">
                    <p style="font-weight:bold;color:#333;margin-bottom:10px">Additional Terms:</p>
                    <p style="white-space:pre-wrap;color:#555">${additionalTerms}</p>
                  </div>` : ''}

                  <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:25px 0;border-radius:4px">
                    <p style="margin:0;color:#856404;font-size:14px">
                      ⚠️ <strong>Important:</strong> This offer is contingent upon successful completion of background verification and reference checks.
                    </p>
                  </div>

                  <p>
                    We are excited about the prospect of you joining our team and look forward to your positive response.
                  </p>

                  <p>
                    Please confirm your acceptance by replying to this email at your earliest convenience.
                  </p>

                  <p style="margin-top:40px">
                    Sincerely,<br />
                    <strong style="color:#667eea">Human Resources Team</strong><br />
                    Hitachi
                  </p>
                </div>

                <hr style="border:none;border-top:1px solid #ddd;margin:40px 0"/>
                
                <p style="color:#999;font-size:12px;text-align:center;margin:0">
                  This is an official offer letter from Hitachi Construction Machinery Zambia Co .Ltd. For questions, please contact our HR team.
                </p>
              </div>
            </body>
          </html>
        `,
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Brevo API error:", result);
        throw new HttpsError("internal", "Failed to send offer letter email", result);
      }

      console.log("✅ Offer letter email sent successfully:", result.messageId);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("🔥 sendOfferLetterEmail error:", error);
      throw error instanceof HttpsError
        ? error
        : new HttpsError("internal", "Unexpected error");
    }
  }
);

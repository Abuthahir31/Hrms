import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../config/firebase'

/**
 * Upload resume file to Firebase Storage
 * @param {File} file - Resume file to upload
 * @param {string} applicantEmail - Email of applicant (used in filename)
 * @returns {Promise<string>} - Download URL of uploaded file
 */
export const uploadResume = async (file, applicantEmail) => {
    try {
        // Create unique filename with timestamp
        const timestamp = Date.now()
        const sanitizedEmail = applicantEmail.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `${sanitizedEmail}_${timestamp}_${file.name}`

        // Create storage reference
        const storageRef = ref(storage, `resumes/${filename}`)

        // Upload file
        const snapshot = await uploadBytes(storageRef, file)

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref)

        return downloadURL
    } catch (error) {
        console.error('Error uploading resume:', error)
        throw new Error('Failed to upload resume. Please try again.')
    }
}

/**
 * Submit job application to Firestore
 * @param {Object} applicationData - Application data object
 * @returns {Promise<string>} - Document ID of created application
 */
export const submitApplication = async (applicationData) => {
    try {
        const docRef = await addDoc(collection(db, 'job_applications'), {
            ...applicationData,
            appliedAt: serverTimestamp(),
            status: 'pending'
        })

        return docRef.id
    } catch (error) {
        console.error('Error submitting application:', error)
        throw new Error('Failed to submit application. Please try again.')
    }
}

/**
 * Send confirmation email via Brevo API
 * @param {string} email - Recipient email
 * @param {string} applicantName - Name of applicant
 * @param {string} jobTitle - Job title applied for
 * @returns {Promise<void>}
 */
export const sendConfirmationEmail = async (email, applicantName, jobTitle) => {
    try {
        const apiKey = process.env.REACT_APP_BREVO_API_KEY

        if (!apiKey) {
            console.warn('Brevo API key not configured. Skipping email.')
            return
        }

        console.log('🔄 Attempting to send email via Brevo...')
        console.log('📧 Recipient:', email)
        console.log('🔑 API Key:', apiKey.substring(0, 20) + '...')

        const emailPayload = {
            sender: {
                name: 'HRMS Portal',
                email: 'myeiokln@gmail.com'  // ⚠️ IMPORTANT: This email must be verified in Brevo!
            },
            to: [
                {
                    email: email,
                    name: applicantName
                }
            ],
            subject: `Application Received - ${jobTitle}`,
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .highlight { background: #e0e7ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Application Received!</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${applicantName},</p>
                            
                            <p>Thank you for applying for the position of <strong>${jobTitle}</strong> at HRMS Portal.</p>
                            
                            <div class="highlight">
                                <p><strong>✓ Your application has been successfully submitted</strong></p>
                                <p>Our recruitment team will review your application and get back to you soon.</p>
                            </div>
                            
                            <p><strong>What happens next?</strong></p>
                            <ul>
                                <li>Our team will review your application within 3-5 business days</li>
                                <li>If your profile matches our requirements, we'll contact you for the next steps</li>
                                <li>You can check your application status in the "My Applications" section</li>
                            </ul>
                            
                            <p>If you have any questions, feel free to reach out to us.</p>
                            
                            <p>Best regards,<br><strong>HRMS Portal Recruitment Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }

        console.log('📤 Sending email payload:', JSON.stringify(emailPayload, null, 2))

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        })

        const responseData = await response.json()

        if (!response.ok) {
            console.error('❌ Brevo API Error Response:', responseData)
            console.error('Status:', response.status, response.statusText)

            // Provide specific error messages
            if (response.status === 401) {
                console.error(`
🚨 BREVO AUTHENTICATION ERROR (401)

Possible causes:
1. Invalid API Key - Check your Brevo API key in .env file
2. Sender email not verified - 'noreply@hrmsportal.com' must be verified in Brevo

SOLUTION:
1. Go to Brevo Dashboard → Settings → Senders
2. Add and verify YOUR email address (e.g., yourname@gmail.com)
3. Update applicationService.js line 79-80 with your verified email:
   
   sender: {
       name: 'HRMS Portal',
       email: 'your-verified-email@gmail.com'  // Use YOUR verified email
   }

4. Or verify 'noreply@hrmsportal.com' if you own that domain
                `)
            }

            throw new Error(`Brevo API Error: ${response.status} - ${JSON.stringify(responseData)}`)
        }

        console.log('✅ Email sent successfully!', responseData)
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error)
        // Don't throw error - email failure shouldn't prevent application submission
    }
}

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { httpsCallable, getFunctions } from 'firebase/functions'
import { db, storage } from '../config/firebase'

// Explicit region for Gen-2 functions
const functions = getFunctions(undefined, 'us-central1')

/**
 * Upload resume file to Firebase Storage
 */
export const uploadResume = async (file, applicantEmail) => {
  try {
    const timestamp = Date.now()
    const sanitizedEmail = applicantEmail.replace(/[^a-zA-Z0-9]/g, '_')
    const extension = file.name.split('.').pop()
    const filename = `${sanitizedEmail}_${timestamp}.${extension}`

    const storageRef = ref(storage, `resumes/${filename}`)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  } catch (error) {
    console.error('❌ Resume upload failed:', error)
    throw new Error('Failed to upload resume')
  }
}

/**
 * Submit job application
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
    console.error('❌ Firestore submit failed:', error)
    throw new Error('Failed to submit application')
  }
}

/**
 * Send confirmation email via Cloud Function
 */
export const sendConfirmationEmail = async (
  email,
  applicantName,
  jobTitle
) => {
  try {
    const sendEmail = httpsCallable(
      functions,
      'sendConfirmationEmail'
    )

    const result = await sendEmail({
      email,
      applicantName,
      jobTitle
    })

    return result.data
  } catch (error) {
    console.error('❌ Email function failed:', error)

    if (error.code) {
      console.error('Code:', error.code)
      console.error('Message:', error.message)
    }

    throw new Error('Email confirmation failed')
  }
}

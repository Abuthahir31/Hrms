import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '../config/firebase'

/**
 * Send OTP to email for verification (Step 1 of signup)
 */
export const sendOTPEmail = async (email, password) => {
    try {
        const sendOTP = httpsCallable(functions, 'sendVerificationOTP')
        const result = await sendOTP({ email, password })

        return {
            success: true,
            message: result.data.message,
            expiresIn: result.data.expiresIn
        }
    } catch (error) {
        console.error('Send OTP error:', error)
        return {
            success: false,
            message: getErrorMessage(error.code) || error.message
        }
    }
}

/**
 * Verify OTP and create Firebase account (Step 2 of signup)
 */
export const verifyOTPAndCreateAccount = async (email, otp, password) => {
    try {
        // Verify OTP and create account via Cloud Function
        const verifyOTPFunc = httpsCallable(functions, 'verifyOTP')
        const verifyResult = await verifyOTPFunc({ email, otp, password })

        if (!verifyResult.data.success) {
            return {
                success: false,
                message: verifyResult.data.message
            }
        }

        return {
            success: true,
            message: verifyResult.data.message,
            uid: verifyResult.data.uid
        }
    } catch (error) {
        console.error('Verify OTP error:', error)
        return {
            success: false,
            message: getErrorMessage(error.code) || error.message
        }
    }
}

/**
 * Resend OTP code
 */
export const resendOTP = async (email, password) => {
    return await sendOTPEmail(email, password)
}

/**
 * Sign in user with email and password
 */
export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // User is already verified via OTP, so no need to check emailVerified
        return {
            success: true,
            message: 'Signed in successfully!',
            user
        }
    } catch (error) {
        console.error('Sign in error:', error)
        return {
            success: false,
            message: getErrorMessage(error.code)
        }
    }
}

/**
 * Sign out the current user
 */
export const signOutUser = async () => {
    try {
        await signOut(auth)
        return {
            success: true,
            message: 'Signed out successfully!'
        }
    } catch (error) {
        console.error('Sign out error:', error)
        return {
            success: false,
            message: 'Failed to sign out. Please try again.'
        }
    }
}

/**
 * Create user profile in Firestore
 */
export const createUserProfile = async (user) => {
    try {
        const userRef = doc(db, 'users', user.uid)

        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            role: 'user', // Default role for job seekers
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })

        return { success: true }
    } catch (error) {
        console.error('Create profile error:', error)
        return { success: false, error }
    }
}

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid, data) => {
    try {
        const userRef = doc(db, 'users', uid)

        await setDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge: true })

        return { success: true }
    } catch (error) {
        console.error('Update profile error:', error)
        return { success: false, error }
    }
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
    try {
        const userRef = doc(db, 'users', uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
            return {
                success: true,
                data: userSnap.data()
            }
        } else {
            return {
                success: false,
                message: 'User profile not found'
            }
        }
    } catch (error) {
        console.error('Get profile error:', error)
        return {
            success: false,
            error
        }
    }
}

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback)
}

/**
 * Get user-friendly error messages
 */
const getErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.'
        case 'auth/invalid-email':
            return 'Invalid email address.'
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled.'
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.'
        case 'auth/user-disabled':
            return 'This account has been disabled.'
        case 'auth/user-not-found':
            return 'No account found with this email.'
        case 'auth/wrong-password':
            return 'Incorrect password.'
        case 'auth/invalid-credential':
            return 'Invalid email or password.'
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.'
        case 'functions/invalid-argument':
            return 'Invalid verification code.'
        case 'functions/not-found':
            return 'No verification request found. Please sign up again.'
        case 'functions/deadline-exceeded':
            return 'Verification code has expired. Please request a new one.'
        case 'functions/resource-exhausted':
            return 'Too many failed attempts. Please sign up again.'
        case 'functions/already-exists':
            return 'This email is already registered. Please sign in instead.'
        default:
            return null
    }
}

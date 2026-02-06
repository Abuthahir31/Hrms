import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChange, getUserProfile } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to authentication state changes
        const unsubscribe = onAuthStateChange(async (user) => {
            setCurrentUser(user)

            if (user && user.emailVerified) {
                // Fetch user profile from Firestore
                const result = await getUserProfile(user.uid)
                if (result.success) {
                    setUserProfile(result.data)
                }
            } else {
                setUserProfile(null)
            }

            setLoading(false)
        })

        // Cleanup subscription
        return unsubscribe
    }, [])

    const value = {
        currentUser,
        userProfile,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

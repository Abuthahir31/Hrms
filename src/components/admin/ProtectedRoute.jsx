import { Navigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../config/firebase'

function ProtectedRoute({ children }) {
    const [user, loading] = useAuthState(auth)

    // Whitelist of admin emails
    const ADMIN_EMAILS = ['hradmin@gmail.com']

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/admin/login" replace />
    }

    // Authenticated but not authorized as admin
    if (!ADMIN_EMAILS.includes(user.email)) {
        // Sign out unauthorized user
        auth.signOut()
        return <Navigate to="/admin/login" replace />
    }

    // Authenticated and authorized
    return children
}

export default ProtectedRoute

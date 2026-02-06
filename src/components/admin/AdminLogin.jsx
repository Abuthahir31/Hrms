import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../config/firebase'

function AdminLogin() {
    const navigate = useNavigate()
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setCredentials({
            ...credentials,
            [name]: value
        })
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        // Whitelist of admin emails
        const ADMIN_EMAILS = ['hradmin@gmail.com']

        try {
            // Try to sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)

            // Check if user email is in admin whitelist
            if (!ADMIN_EMAILS.includes(userCredential.user.email)) {
                // Not an admin - sign out immediately
                await auth.signOut()
                setError('Access denied. This account is not authorized for admin access.')
                setIsLoading(false)
                return
            }

            // Admin verified - redirect to admin dashboard
            navigate('/admin')
        } catch (error) {
            console.error('Login error:', error)

            // If user not found and trying to login as admin, create the account
            if (error.code === 'auth/user-not-found' && credentials.email === 'hradmin@gmail.com') {
                try {
                    // Import createUserWithEmailAndPassword
                    const { createUserWithEmailAndPassword } = await import('firebase/auth')
                    await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)
                    alert('Admin account created successfully! Please login again.')
                    setError('Admin account created. Please login.')
                } catch (createError) {
                    console.error('Error creating admin:', createError)
                    setError('Failed to create admin account. Please contact support.')
                }
            } else if (error.code === 'auth/invalid-credential') {
                setError('Invalid email or password.')
            } else if (error.code === 'auth/user-not-found') {
                setError('No account found with this email.')
            } else if (error.code === 'auth/wrong-password') {
                setError('Incorrect password.')
            } else if (error.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.')
            } else {
                setError('Failed to sign in. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background Elements - Hitachi Orange */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative">
                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-orange-600">
                    {/* Header with Hitachi Branding */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-10 text-center">
                        {/* Hitachi Logo Placeholder - Construction Icon */}
                        <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-xl bg-orange-600 mb-4 shadow-lg">
                            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>

                        <h1 className="text-xl font-bold text-white mb-1">
                            Hitachi Construction Machinery
                        </h1>
                        <p className="text-orange-400 text-sm font-semibold mb-3">
                            Zambia Co., Ltd
                        </p>
                        <div className="h-px bg-gradient-to-r from-transparent via-orange-600 to-transparent mb-3"></div>
                        <h2 className="text-lg font-bold text-orange-500">
                            HR Admin Portal
                        </h2>
                        <p className="text-gray-400 text-xs mt-2">
                            Secure Management System
                        </p>
                    </div>

                    {/* Login Form */}
                    <form className="px-8 py-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-600 text-red-800 px-4 py-3 rounded flex items-start gap-3 animate-shake">
                                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={credentials.email}
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all duration-200"
                                        placeholder="admin@hitachi-cm.co.zm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={credentials.password}
                                        onChange={handleChange}
                                        className="appearance-none block w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all duration-200"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer font-medium">
                                    Remember me
                                </label>
                            </div>

                            {/* <div className="text-sm">
                                <a href="#" className="font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                                    Forgot password?
                                </a>
                            </div> */}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-bold rounded-lg text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In to Portal
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 0 012 2v5a2 0 01-2 2H5a2 0 01-2-2v-5a2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">Secure Access</span>
                            <span className="text-gray-400">•</span>
                            <span>Authorized Personnel Only</span>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">
                            © 2024 Hitachi Construction Machinery Zambia Co., Ltd
                        </p>
                    </div>
                </div>

                {/* Tagline */}
                <div className="text-center">
                    <p className="text-orange-500 font-bold text-sm tracking-wide">
                        RELIABLE • INNOVATIVE • TRUSTED
                    </p>
                </div>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s;
                }
            `}</style>
        </div>
    )
}

export default AdminLogin
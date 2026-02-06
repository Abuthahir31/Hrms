import React, { useState, useEffect } from 'react'
import { sendOTPEmail, verifyOTPAndCreateAccount, signInWithEmail, resendOTP } from '../../services/authService'

function UserLogin({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('signin')
    const [signupStep, setSignupStep] = useState('form') // 'form' or 'verify-otp'
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [otpTimer, setOtpTimer] = useState(0)

    // Form states
    const [signupData, setSignupData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })

    const [otpData, setOtpData] = useState({
        otp: ['', '', '', '', '', '']
    })

    const [signinData, setSigninData] = useState({
        email: '',
        password: ''
    })

    // OTP Timer countdown
    useEffect(() => {
        if (otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [otpTimer])

    // Password validation
    const validatePassword = (password) => {
        if (password.length < 6) return 'Password must be at least 6 characters'
        return ''
    }

    // Handle signup - Step 1: Send OTP
    const handleSignup = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        // Validation
        if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
            setMessage({ type: 'error', text: 'Please fill in all fields' })
            return
        }

        if (signupData.password !== signupData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' })
            return
        }

        const passwordError = validatePassword(signupData.password)
        if (passwordError) {
            setMessage({ type: 'error', text: passwordError })
            return
        }

        setLoading(true)
        const result = await sendOTPEmail(signupData.email, signupData.password)
        setLoading(false)

        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            setSignupStep('verify-otp')
            setOtpTimer(result.expiresIn || 600) // 10 minutes
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[0]
        if (!/^\d*$/.test(value)) return // Only digits

        const newOtp = [...otpData.otp]
        newOtp[index] = value
        setOtpData({ otp: newOtp })

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus()
        }
    }

    // Handle OTP backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpData.otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus()
        }
    }

    // Handle OTP verification - Step 2: Verify OTP and create account
    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        const otpCode = otpData.otp.join('')
        if (otpCode.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter the complete 6-digit code' })
            return
        }

        setLoading(true)
        const result = await verifyOTPAndCreateAccount(
            signupData.email,
            otpCode,
            signupData.password
        )
        setLoading(false)

        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            // Reset form and switch to signin
            setTimeout(() => {
                setSignupData({ email: '', password: '', confirmPassword: '' })
                setOtpData({ otp: ['', '', '', '', '', ''] })
                setSignupStep('form')
                setActiveTab('signin')
                setMessage({ type: '', text: '' })
            }, 2000)
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    // Handle resend OTP
    const handleResendOTP = async () => {
        setLoading(true)
        const result = await resendOTP(signupData.email, signupData.password)
        setLoading(false)

        if (result.success) {
            setMessage({ type: 'success', text: 'New verification code sent!' })
            setOtpTimer(result.expiresIn || 600)
            setOtpData({ otp: ['', '', '', '', '', ''] })
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    // Handle signin
    const handleSignin = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (!signinData.email || !signinData.password) {
            setMessage({ type: 'error', text: 'Please fill in all fields' })
            return
        }

        setLoading(true)
        const result = await signInWithEmail(signinData.email, signinData.password)
        setLoading(false)

        if (result.success) {
            setMessage({ type: 'success', text: result.message })
            setSigninData({ email: '', password: '' })
            setTimeout(() => {
                onClose()
                setMessage({ type: '', text: '' })
            }, 1000)
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    // Format timer display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 relative">
                    <button
                        onClick={() => {
                            onClose()
                            setSignupStep('form')
                            setMessage({ type: '', text: '' })
                        }}
                        className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-white">Welcome to HRMS</h2>
                    <p className="text-purple-100 mt-1">
                        {signupStep === 'verify-otp' ? 'Verify your email' : 'Sign in to find your dream job'}
                    </p>
                </div>

                {/* Tabs - Only show if not in OTP verification step */}
                {signupStep === 'form' && (
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => {
                                setActiveTab('signin')
                                setMessage({ type: '', text: '' })
                            }}
                            className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'signin'
                                    ? 'text-purple-600 border-b-2 border-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('signup')
                                setMessage({ type: '', text: '' })
                            }}
                            className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'signup'
                                    ? 'text-purple-600 border-b-2 border-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {/* Message Display */}
                {message.text && (
                    <div className={`mx-6 mt-4 p-3 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {/* Forms */}
                <div className="p-6">
                    {activeTab === 'signin' ? (
                        <form onSubmit={handleSignin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={signinData.email}
                                    onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="your.email@example.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={signinData.password}
                                    onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your password"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>
                    ) : signupStep === 'form' ? (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={signupData.email}
                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="your.email@example.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={signupData.password}
                                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="At least 6 characters"
                                    disabled={loading}
                                />
                                {signupData.password && (
                                    <p className={`text-xs mt-1 ${signupData.password.length >= 6 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {signupData.password.length >= 6 ? '✓ Strong password' : '✗ Password too short'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={signupData.confirmPassword}
                                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Re-enter your password"
                                    disabled={loading}
                                />
                                {signupData.confirmPassword && (
                                    <p className={`text-xs mt-1 ${signupData.password === signupData.confirmPassword ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {signupData.password === signupData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>

                            <p className="text-xs text-gray-600 text-center">
                                We'll send a 6-digit verification code to your email inbox.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    Enter the 6-digit code sent to<br />
                                    <strong>{signupData.email}</strong>
                                </p>

                                <div className="flex gap-2 justify-center mb-4">
                                    {otpData.otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                            disabled={loading}
                                        />
                                    ))}
                                </div>

                                {otpTimer > 0 && (
                                    <p className="text-sm text-center text-gray-600">
                                        Code expires in <strong className="text-purple-600">{formatTime(otpTimer)}</strong>
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>

                            <div className="flex items-center justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setSignupStep('form')}
                                    className="text-gray-600 hover:text-gray-800"
                                    disabled={loading}
                                >
                                    ← Change Email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading || otpTimer > 540} // Disable if more than 9 minutes left
                                    className="text-purple-600 hover:text-purple-700 font-medium disabled:text-purple-300"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserLogin

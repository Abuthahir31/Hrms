import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { signOutUser } from '../../services/authService'
import UserLogin from './UserLogin'

function UserNavbar({ toggleSidebar, isSidebarOpen }) {
    const { currentUser, userProfile } = useAuth()
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    const handleSignOut = async () => {
        await signOutUser()
        setShowDropdown(false)
    }

    const getInitials = (email) => {
        if (!email) return 'U'
        return email.substring(0, 2).toUpperCase()
    }

    const getDisplayName = () => {
        if (userProfile?.displayName) return userProfile.displayName
        if (currentUser?.email) return currentUser.email.split('@')[0]
        return 'User'
    }

    return (
        <>
            <nav className="bg-white border-b-2 border-purple-100 fixed w-full z-30 top-0 shadow-sm">
                <div className="px-4 py-3 lg:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-lg text-gray-600 hover:bg-purple-50 transition-colors lg:hidden"
                            >
                                {isSidebarOpen ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>

                            <div className="flex items-center gap-3">
                                {/* <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">User</span>
                                </div> */}
                                <div>
                                    <h1 className="text-xl font-bold text-purple-600">Hitachi</h1>
                                    <p className="text-xs text-gray-600 font-medium">Find Your Dream Job</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {currentUser && currentUser.emailVerified ? (
                                <div className="relative flex items-center gap-3 pl-4 border-l-2 border-gray-200">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-gray-900">{getDisplayName()}</p>
                                        <p className="text-xs text-purple-600 font-semibold">
                                            {userProfile?.role === 'user' ? 'Job Seeker' : userProfile?.role}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
                                    >
                                        <span className="text-white font-semibold">
                                            {getInitials(currentUser.email)}
                                        </span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
                                                <p className="text-xs text-gray-600 truncate">{currentUser.email}</p>
                                            </div>
                                            {/* <button
                                                onClick={() => {
                                                    setShowDropdown(false)
                                                    // Navigate to profile page when implemented
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Profile
                                                </div>
                                            </button> */}
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sign Out
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Login Modal */}
            <UserLogin isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </>
    )
}

export default UserNavbar

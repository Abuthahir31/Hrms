

function UserNavbar({ toggleSidebar, isSidebarOpen }) {
    return (
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
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">HR</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-purple-600">HRMS Portal</h1>
                                <p className="text-xs text-gray-600 font-medium">Find Your Dream Job</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pl-4 border-l-2 border-gray-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900">John Doe</p>
                                <p className="text-xs text-purple-600 font-semibold">Job Seeker</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">JD</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default UserNavbar

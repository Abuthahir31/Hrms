import { Link, useLocation } from 'react-router-dom'

function UserSidebar({ isOpen, closeSidebar }) {
    const location = useLocation()

    const menuItems = [
        {
            name: 'Job Openings',
            path: '/user/home',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
        // {
        //     name: 'My Applications',
        //     path: '/user/applications',
        //     icon: (
        //         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        //         </svg>
        //     )
        // },
        // {
        //     name: 'Profile',
        //     path: '/user/profile',
        //     icon: (
        //         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        //         </svg>
        //     )
        // },
    ]

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-35 lg:hidden"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 w-64 bg-white border-r border-gray-200
                transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                top-20 h-[calc(100vh-5rem)] z-40
            `}>
                {/* Sidebar Content */}
                <div className="h-full flex flex-col">
                    {/* Header - Only on mobile */}
                    <div className="lg:hidden bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-sm">User Panel</h2>
                                <p className="text-purple-100 text-xs">Job Seeker</p>
                            </div>
                        </div>
                        <button
                            onClick={closeSidebar}
                            className="p-1.5 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        <ul className="space-y-1">
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path
                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            onClick={closeSidebar}
                                            className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                                        >
                                            {item.icon}
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    {/* Switch Panel Button
                    <div className="border-t border-gray-200 p-3">
                        <Link
                            to="/admin/recruitment"
                            onClick={closeSidebar}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span className="text-sm">Switch to Admin</span>
                        </Link>
                    </div> */}
                </div>
            </aside>
        </>
    )
}

export default UserSidebar

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import UserNavbar from './UserNavbar'
import UserSidebar from './UserSidebar'

function UserLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
    const closeSidebar = () => setIsSidebarOpen(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <UserNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            <UserSidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

            <div className="pt-20 lg:pl-64">
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default UserLayout

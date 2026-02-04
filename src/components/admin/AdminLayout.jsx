import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'
import AdminSidebar from './AdminSidebar'

function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
    const closeSidebar = () => setIsSidebarOpen(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            <AdminSidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

            <div className="pt-20 lg:pl-64">
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AdminLayout

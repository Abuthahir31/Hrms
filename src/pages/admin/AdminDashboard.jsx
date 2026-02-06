import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'

function AdminDashboard() {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        expiredJobs: 0
    })

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)

                // Fetch jobs from Firestore
                const jobsRef = collection(db, 'job_postings')
                const jobsQuery = query(jobsRef, orderBy('postedDate', 'desc'))
                const jobsSnapshot = await getDocs(jobsQuery)
                const jobsList = jobsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))

                // Fetch applications from Firestore
                const applicationsRef = collection(db, 'job_applications')
                const applicationsSnapshot = await getDocs(applicationsRef)
                const totalApplications = applicationsSnapshot.size

                // Calculate active and expired jobs
                const now = new Date()
                const activeJobs = jobsList.filter(job =>
                    !job.expiryDateTime || new Date(job.expiryDateTime) > now
                )
                const expiredJobs = jobsList.filter(job =>
                    job.expiryDateTime && new Date(job.expiryDateTime) <= now
                )

                setJobs(jobsList)
                setStats({
                    totalJobs: jobsList.length,
                    activeJobs: activeJobs.length,
                    totalApplications: totalApplications,
                    expiredJobs: expiredJobs.length
                })
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    const recentJobs = jobs.slice(0, 5)

    return (
        <div className="p-6 lg:p-8">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, Admin! 👋</h1>
                <p className="text-gray-600">Here's what's happening with your recruitment today.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Jobs */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">
                            Total
                        </span>
                    </div>
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-blue-200 rounded w-16 mb-2"></div>
                            <div className="h-4 bg-blue-200 rounded w-32"></div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-3xl font-bold text-blue-700 mb-1">{stats.totalJobs}</h3>
                            <p className="text-sm font-medium text-gray-700">Total Job Postings</p>
                        </>
                    )}
                </div>

                {/* Active Jobs */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold text-green-600 bg-green-200 px-3 py-1 rounded-full">
                            Active
                        </span>
                    </div>
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-green-200 rounded w-16 mb-2"></div>
                            <div className="h-4 bg-green-200 rounded w-32"></div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-3xl font-bold text-green-700 mb-1">{stats.activeJobs}</h3>
                            <p className="text-sm font-medium text-gray-700">Active Openings</p>
                        </>
                    )}
                </div>

                {/* Total Applications */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">
                            Total
                        </span>
                    </div>
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-purple-200 rounded w-16 mb-2"></div>
                            <div className="h-4 bg-purple-200 rounded w-32"></div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-3xl font-bold text-purple-700 mb-1">{stats.totalApplications}</h3>
                            <p className="text-sm font-medium text-gray-700">Total Applications</p>
                        </>
                    )}
                </div>

            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Link to="/admin/recruitment" className="card hover:border-blue-300 group">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Post New Job</h3>
                            <p className="text-sm text-gray-600">Create a new job opening</p>
                        </div>
                    </div>
                </Link>


            </div>

            {/* Recent Job Postings */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Job Postings</h2>
                    <Link to="/admin/recruitment" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
                        View All
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading jobs...</p>
                    </div>
                ) : recentJobs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Postings Yet</h3>
                        <p className="text-gray-600 mb-4">Start by creating your first job posting</p>
                        <Link to="/admin/recruitment" className="btn-primary inline-block">
                            Create Job Posting
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Title</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentJobs.map((job) => {
                                    const isExpired = job.expiryDateTime && new Date(job.expiryDateTime) <= new Date()
                                    return (
                                        <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-gray-900">{job.jobTitle}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                    {job.department}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-gray-700">{job.employmentType}</td>
                                            <td className="py-4 px-4 text-gray-700">{job.location}</td>
                                            <td className="py-4 px-4">
                                                {isExpired ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard

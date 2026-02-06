import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

function Reporting() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalApplications: 0,
        shortlisted: 0,
        selected: 0,
        offerLetters: 0,
        users: 0
    })

    const [applications, setApplications] = useState([])
    const [users, setUsers] = useState([])
    const [offerLetters, setOfferLetters] = useState([])

    const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        try {
            setLoading(true)

            // Fetch applications
            const appsRef = collection(db, 'job_applications')
            const appsSnapshot = await getDocs(appsRef)
            const appsData = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setApplications(appsData)

            // Fetch users
            const usersRef = collection(db, 'users')
            const usersSnapshot = await getDocs(usersRef)
            const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setUsers(usersData)

            // Fetch offer letters
            const offersRef = collection(db, 'offer_letters')
            const offersSnapshot = await getDocs(offersRef)
            const offersData = offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setOfferLetters(offersData)

            // Calculate stats
            const shortlistedCount = appsData.filter(app => app.status === 'shortlisted').length
            const selectedCount = appsData.filter(app => app.status === 'selected').length

            setStats({
                totalApplications: appsData.length,
                shortlisted: shortlistedCount,
                selected: selectedCount,
                offerLetters: offersData.length,
                users: usersData.length
            })
        } catch (error) {
            console.error('Error fetching data:', error)
            alert('Failed to load reporting data')
        } finally {
            setLoading(false)
        }
    }

    // PDF Generation Functions
    const downloadAllApplicationsPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.text('All Applications Report', 14, 20)
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
        doc.text(`Total Applications: ${applications.length}`, 14, 35)

        const tableData = applications.map(app => [
            app.personalDetails?.fullName || 'N/A',
            app.personalDetails?.email || 'N/A',
            app.personalDetails?.phone || 'N/A',
            app.jobTitle || 'N/A',
            app.status || 'pending',
            app.appliedAt ? new Date(app.appliedAt.toDate()).toLocaleDateString() : 'N/A'
        ])

        doc.autoTable({
            startY: 42,
            head: [['Name', 'Email', 'Phone', 'Job Applied', 'Status', 'Applied Date']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        })

        doc.save('all-applications-report.pdf')
    }

    const downloadShortlistedPDF = () => {
        const doc = new jsPDF()
        const shortlistedApps = applications.filter(app => app.status === 'shortlisted')

        doc.setFontSize(18)
        doc.text('Shortlisted Candidates Report', 14, 20)
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
        doc.text(`Total Shortlisted: ${shortlistedApps.length}`, 14, 35)

        const tableData = shortlistedApps.map(app => [
            app.personalDetails?.fullName || 'N/A',
            app.personalDetails?.email || 'N/A',
            app.jobTitle || 'N/A',
            app.interview?.date || 'Not Scheduled',
            app.interview?.mode || 'N/A'
        ])

        doc.autoTable({
            startY: 42,
            head: [['Name', 'Email', 'Job Title', 'Interview Date', 'Mode']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 }
        })

        doc.save('shortlisted-candidates-report.pdf')
    }

    const downloadSelectedPDF = () => {
        const doc = new jsPDF()
        const selectedApps = applications.filter(app => app.status === 'selected')

        doc.setFontSize(18)
        doc.text('Selected Candidates Report', 14, 20)
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
        doc.text(`Total Selected: ${selectedApps.length}`, 14, 35)

        const tableData = selectedApps.map(app => [
            app.personalDetails?.fullName || 'N/A',
            app.personalDetails?.email || 'N/A',
            app.jobTitle || 'N/A',
            app.evaluation?.rating || 'N/A',
            app.evaluation?.feedback || 'N/A'
        ])

        doc.autoTable({
            startY: 42,
            head: [['Name', 'Email', 'Job Title']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246] },
            styles: { fontSize: 9 }
        })

        doc.save('selected-candidates-report.pdf')
    }

    const downloadOfferLettersPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.text('Offer Letters Report', 14, 20)
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
        doc.text(`Total Offer Letters: ${offerLetters.length}`, 14, 35)

        const tableData = offerLetters.map(offer => [
            offer.candidateName || 'N/A',
            offer.candidateEmail || 'N/A',
            offer.role || 'N/A',
            offer.salary ? `₹${parseInt(offer.salary).toLocaleString()}` : 'N/A',
            offer.joiningDate || 'N/A',
            offer.status || 'N/A'
        ])

        doc.autoTable({
            startY: 42,
            head: [['Candidate', 'Email', 'Role', 'Salary', 'Joining Date']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11] },
            styles: { fontSize: 8 }
        })

        doc.save('offer-letters-report.pdf')
    }

    const downloadUsersPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.text('Registered Users Report', 14, 20)
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
        doc.text(`Total Users: ${users.length}`, 14, 35)

        const tableData = users.map(user => [
            user.email || 'N/A',
            user.role || 'user',
            user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'
        ])

        doc.autoTable({
            startY: 42,
            head: [['Email', 'Role', 'Registration Date']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] },
            styles: { fontSize: 9 }
        })

        doc.save('registered-users-report.pdf')
    }

    // Chart data
    const applicationStatusData = [
        { name: 'Pending', value: applications.filter(app => !app.status || app.status === 'pending').length },
        { name: 'Shortlisted', value: stats.shortlisted },
        { name: 'Selected', value: stats.selected },
        { name: 'Rejected', value: applications.filter(app => app.status === 'rejected').length },
        { name: 'On Hold', value: applications.filter(app => app.status === 'on_hold').length }
    ].filter(item => item.value > 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Reporting Dashboard</h1>
                <p className="text-gray-600">View statistics and download detailed reports</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Applications */}
                <div className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                            <p className="text-3xl font-bold text-primary-600">{stats.totalApplications}</p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                    <button
                        onClick={downloadAllApplicationsPDF}
                        className="btn-primary w-full text-sm"
                    >
                        📥 Download PDF
                    </button>
                </div>

                {/* Shortlisted */}
                <div className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Shortlisted</p>
                            <p className="text-3xl font-bold text-green-600">{stats.shortlisted}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                    <button
                        onClick={downloadShortlistedPDF}
                        className="btn-primary w-full text-sm bg-green-600 hover:bg-green-700"
                    >
                        📥 Download PDF
                    </button>
                </div>

                {/* Selected */}
                <div className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Selected</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.selected}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🎉</span>
                        </div>
                    </div>
                    <button
                        onClick={downloadSelectedPDF}
                        className="btn-primary w-full text-sm bg-purple-600 hover:bg-purple-700"
                    >
                        📥 Download PDF
                    </button>
                </div>

                {/* Offer Letters */}
                <div className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Offer Letters</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.offerLetters}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📄</span>
                        </div>
                    </div>
                    <button
                        onClick={downloadOfferLettersPDF}
                        className="btn-primary w-full text-sm bg-yellow-600 hover:bg-yellow-700"
                    >
                        📥 Download PDF
                    </button>
                </div>

                {/* Users */}
                <div className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Registered Users</p>
                            <p className="text-3xl font-bold text-red-600">{stats.users}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                    <button
                        onClick={downloadUsersPDF}
                        className="btn-primary w-full text-sm bg-red-600 hover:bg-red-700"
                    >
                        📥 Download PDF
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status Chart */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Application Status Breakdown</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={applicationStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {applicationStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Summary</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Total Applications</span>
                            <span className="text-xl font-bold text-primary-600">{stats.totalApplications}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Shortlisted Rate</span>
                            <span className="text-xl font-bold text-green-600">
                                {stats.totalApplications > 0 ? ((stats.shortlisted / stats.totalApplications) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Selection Rate</span>
                            <span className="text-xl font-bold text-purple-600">
                                {stats.totalApplications > 0 ? ((stats.selected / stats.totalApplications) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Offer Letters Sent</span>
                            <span className="text-xl font-bold text-yellow-600">{stats.offerLetters}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Total Users</span>
                            <span className="text-xl font-bold text-red-600">{stats.users}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Reporting

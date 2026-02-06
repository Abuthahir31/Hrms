import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../config/firebase'

function ResumeScreening() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedApp, setSelectedApp] = useState(null)
    const [showInterviewModal, setShowInterviewModal] = useState(false)
    const [showEvaluationModal, setShowEvaluationModal] = useState(false)
    const [activeTab, setActiveTab] = useState('pending') // pending, shortlisted, interviewed

    // Filter States
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('')
    const [jobFilter, setJobFilter] = useState('')
    const [jobs, setJobs] = useState([])
    const [departments, setDepartments] = useState([])

    const [interviewDetails, setInterviewDetails] = useState({
        date: '',
        time: '',
        mode: 'online',
        meetingLink: '',
        location: ''
    })

    const [evaluation, setEvaluation] = useState({
        technicalSkills: 3,
        communication: 3,
        Fit: 3,
        notes: ''
    })

    const sendEmailNotification = async (app, status, additionalData = {}) => {
        try {
            const sendEmail = httpsCallable(functions, 'sendApplicationUpdateEmail')
            await sendEmail({
                email: app.personalDetails.email,
                applicantName: app.personalDetails.fullName,
                jobTitle: app.jobTitle,
                status: status,
                additionalData: additionalData
            })
            console.log(`Email notification sent for status: ${status}`)
        } catch (error) {
            console.error('Error sending email:', error)
            alert('Failed to send email notification. Check console for details.')
        }
    }

    // Fetch data from Firestore
    useEffect(() => {
        const fetchInitialData = async () => {
            await Promise.all([
                fetchApplications(),
                fetchJobs(),
                fetchDepartments()
            ])
        }
        fetchInitialData()
    }, [])

    const fetchApplications = async () => {
        try {
            setLoading(true)
            const applicationsRef = collection(db, 'job_applications')
            const q = query(applicationsRef, orderBy('appliedAt', 'desc'))
            const querySnapshot = await getDocs(q)

            const apps = []
            querySnapshot.forEach((doc) => {
                apps.push({
                    id: doc.id,
                    ...doc.data()
                })
            })

            setApplications(apps)
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchJobs = async () => {
        try {
            const jobsRef = collection(db, 'job_postings')
            const q = query(jobsRef, orderBy('postedDate', 'desc'))
            const querySnapshot = await getDocs(q)
            const jobsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setJobs(jobsList)
        } catch (error) {
            console.error('Error fetching jobs:', error)
        }
    }

    const fetchDepartments = async () => {
        try {
            const deptsRef = collection(db, 'departments')
            const q = query(deptsRef, orderBy('name', 'asc'))
            const querySnapshot = await getDocs(q)
            const deptsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setDepartments(deptsList)
        } catch (error) {
            console.error('Error fetching departments:', error)
        }
    }

    const updateApplicationStatus = async (appId, status, additionalData = {}) => {
        try {
            const appRef = doc(db, 'job_applications', appId)
            await updateDoc(appRef, {
                status,
                ...additionalData,
                [`${status}At`]: new Date()
            })

            // Refresh applications
            await fetchApplications()
        } catch (error) {
            console.error('Error updating application:', error)
            alert('Failed to update application status')
        }
    }

    const handleShortlist = (app) => {
        setSelectedApp(app)
        setShowInterviewModal(true)
    }

    const handleHold = async (app) => {
        if (window.confirm(`Put ${app.personalDetails.fullName}'s application on hold?`)) {
            await updateApplicationStatus(app.id, 'on_hold')
            await sendEmailNotification(app, 'on_hold')
            alert('Application put on hold and email sent.')
        }
    }

    const handleReject = async (app) => {
        if (window.confirm(`Reject ${app.personalDetails.fullName}'s application?`)) {
            await updateApplicationStatus(app.id, 'rejected')
            await sendEmailNotification(app, 'rejected')
            alert('Application rejected and email sent.')
        }
    }

    const handleScheduleInterview = async () => {
        if (!interviewDetails.date || !interviewDetails.time) {
            alert('Please fill in date and time')
            return
        }

        if (interviewDetails.mode === 'online' && !interviewDetails.meetingLink) {
            alert('Please provide meeting link for online interview')
            return
        }

        if (interviewDetails.mode === 'offline' && !interviewDetails.location) {
            alert('Please provide location for offline interview')
            return
        }

        await updateApplicationStatus(selectedApp.id, 'shortlisted', {
            interview: {
                ...interviewDetails,
                scheduledAt: new Date()
            }
        })

        // Send interview invitation email
        await sendEmailNotification(selectedApp, 'shortlisted', {
            interview: interviewDetails
        })

        alert('Interview scheduled and invitation email sent!')

        setShowInterviewModal(false)
        setInterviewDetails({
            date: '',
            time: '',
            mode: 'online',
            meetingLink: '',
            location: ''
        })
    }

    const handleEvaluate = (app) => {
        setSelectedApp(app)
        setShowEvaluationModal(true)
    }

    const handleSelect = async () => {
        await updateApplicationStatus(selectedApp.id, 'selected', {
            evaluation: {
                ...evaluation,
                evaluatedAt: new Date(),
                evaluatedBy: 'admin@hrms.com' // TODO: Get from auth
            }
        })

        // Send offer letter email
        await sendEmailNotification(selectedApp, 'selected')

        alert('Candidate selected and offer email sent!')

        setShowEvaluationModal(false)
        setEvaluation({
            technicalSkills: 3,
            communication: 3,
            Fit: 3,
            notes: ''
        })
    }

    const handleRejectAfterInterview = async () => {
        if (window.confirm(`Reject ${selectedApp.personalDetails.fullName} after interview?`)) {
            await updateApplicationStatus(selectedApp.id, 'rejected', {
                evaluation: {
                    ...evaluation,
                    evaluatedAt: new Date(),
                    evaluatedBy: 'admin@hrms.com'
                }
            })

            // Send rejection email
            await sendEmailNotification(selectedApp, 'rejected')

            alert('Application rejected and email sent.')

            setShowEvaluationModal(false)
        }
    }

    const filteredApplications = applications.filter(app => {
        // Tab Filter
        let matchesTab = false
        if (activeTab === 'pending') matchesTab = app.status === 'pending' || app.status === 'on_hold' || !app.status
        else if (activeTab === 'shortlisted') matchesTab = app.status === 'shortlisted'
        else if (activeTab === 'interviewed') matchesTab = app.status === 'interviewed' || app.status === 'selected' || app.status === 'rejected'

        if (!matchesTab) return false

        // Search Filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            const nameMatch = app.personalDetails?.fullName?.toLowerCase().includes(searchLower)
            const emailMatch = app.personalDetails?.email?.toLowerCase().includes(searchLower)
            if (!nameMatch && !emailMatch) return false
        }

        // Job Filter
        if (jobFilter && app.jobId !== jobFilter) return false

        // Department Filter
        if (departmentFilter) {
            const job = jobs.find(j => j.id === app.jobId)
            if (!job || job.department !== departmentFilter) return false
        }

        return true
    })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Screening</h1>
                <p className="text-gray-600">Review applications and manage interview process</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Search by name or email"
                        />
                    </div>

                    {/* Department Filter */}
                    <div>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Job Filter */}
                    <div>
                        <select
                            value={jobFilter}
                            onChange={(e) => setJobFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg"
                        >
                            <option value="">All Jobs</option>
                            {jobs
                                .filter(job => !departmentFilter || job.department === departmentFilter)
                                .map((job) => (
                                    <option key={job.id} value={job.id}>{job.jobTitle}</option>
                                ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'pending'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Pending Applications ({applications.filter(a => a.status === 'pending' || a.status === 'on_hold' || !a.status).length})
                </button>
                <button
                    onClick={() => setActiveTab('shortlisted')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'shortlisted'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Shortlisted ({applications.filter(a => a.status === 'shortlisted').length})
                </button>
                <button
                    onClick={() => setActiveTab('interviewed')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'interviewed'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Processed ({applications.filter(a => a.status === 'interviewed' || a.status === 'selected' || a.status === 'rejected').length})
                </button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="card text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading applications...</p>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="card text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-600">There are no applications in this category</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((app) => (
                        <div key={app.id} className="card hover:border-primary-200 transition-colors">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Applicant Info */}
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {app.personalDetails?.fullName || 'N/A'}
                                            </h3>
                                            <p className="text-primary-600 font-semibold">{app.jobTitle || 'N/A'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${app.status === 'selected' ? 'bg-green-100 text-green-700' :
                                            app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700' :
                                                    app.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {app.status || 'pending'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{app.personalDetails?.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{app.personalDetails?.phone || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {app.skills && app.skills.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Skills:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {app.skills.slice(0, 5).map((skill, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {app.skills.length > 5 && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                        +{app.skills.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Interview Details (if shortlisted) */}
                                    {app.interview && (
                                        <div className="p-3 bg-blue-50 rounded-lg mb-4">
                                            <p className="text-sm font-semibold text-blue-900 mb-2">Interview Scheduled</p>
                                            <div className="text-sm text-blue-700 space-y-1">
                                                <p>📅 {app.interview.date} at {app.interview.time}</p>
                                                <p>📍 {app.interview.mode === 'online' ? `Online: ${app.interview.meetingLink}` : `Offline: ${app.interview.location}`}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 lg:w-48">
                                    {/* Download Resume */}
                                    {app.resumeUrl && (
                                        <a
                                            href={app.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-secondary text-sm flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Resume
                                        </a>
                                    )}

                                    {/* Pending Actions */}
                                    {(app.status === 'pending' || !app.status) && (
                                        <>
                                            <button
                                                onClick={() => handleShortlist(app)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                            >
                                                ✓ Shortlist
                                            </button>
                                            <button
                                                onClick={() => handleHold(app)}
                                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                                            >
                                                ⏸ Hold
                                            </button>
                                            <button
                                                onClick={() => handleReject(app)}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                            >
                                                ✕ Reject
                                            </button>
                                        </>
                                    )}

                                    {/* Shortlisted Actions */}
                                    {app.status === 'shortlisted' && (
                                        <button
                                            onClick={() => handleEvaluate(app)}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                                        >
                                            📝 Evaluate
                                        </button>
                                    )}

                                    {/* On Hold Actions */}
                                    {app.status === 'on_hold' && (
                                        <button
                                            onClick={() => handleShortlist(app)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                        >
                                            ✓ Shortlist
                                        </button>
                                    )}

                                    {/* Selected - Generate Offer Letter */}
                                    {app.status === 'selected' && (
                                        <button
                                            onClick={() => navigate(`/admin/offer-letter/${app.id}`)}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                                        >
                                            📄 Generate Offer Letter
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Interview Scheduling Modal */}
            {showInterviewModal && selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
                            <button
                                onClick={() => setShowInterviewModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="p-4 bg-primary-50 rounded-lg">
                                <p className="font-semibold text-gray-900">{selectedApp.personalDetails?.fullName}</p>
                                <p className="text-sm text-gray-600">{selectedApp.jobTitle}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Interview Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={interviewDetails.date}
                                        onChange={(e) => setInterviewDetails({ ...interviewDetails, date: e.target.value })}
                                        className="input-field"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Interview Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={interviewDetails.time}
                                        onChange={(e) => setInterviewDetails({ ...interviewDetails, time: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Interview Mode <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="online"
                                            checked={interviewDetails.mode === 'online'}
                                            onChange={(e) => setInterviewDetails({ ...interviewDetails, mode: e.target.value })}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <span>Online</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value="offline"
                                            checked={interviewDetails.mode === 'offline'}
                                            onChange={(e) => setInterviewDetails({ ...interviewDetails, mode: e.target.value })}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <span>Offline</span>
                                    </label>
                                </div>
                            </div>

                            {interviewDetails.mode === 'online' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Meeting Link <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={interviewDetails.meetingLink}
                                        onChange={(e) => setInterviewDetails({ ...interviewDetails, meetingLink: e.target.value })}
                                        className="input-field"
                                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={interviewDetails.location}
                                        onChange={(e) => setInterviewDetails({ ...interviewDetails, location: e.target.value })}
                                        className="input-field"
                                        placeholder="Office Building, Room 301"
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleScheduleInterview}
                                    className="btn-primary flex-1"
                                >
                                    Schedule & Send Invitation
                                </button>
                                <button
                                    onClick={() => setShowInterviewModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaluationModal && selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Interview Evaluation</h2>
                            <button
                                onClick={() => setShowEvaluationModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="p-4 bg-primary-50 rounded-lg">
                                <p className="font-semibold text-gray-900">{selectedApp.personalDetails?.fullName}</p>
                                <p className="text-sm text-gray-600">{selectedApp.jobTitle}</p>
                                {selectedApp.interview && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Interview: {selectedApp.interview.date} at {selectedApp.interview.time}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Technical Skills (1-5)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={evaluation.technicalSkills}
                                    onChange={(e) => setEvaluation({ ...evaluation, technicalSkills: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-600 mt-1">
                                    <span>Poor</span>
                                    <span className="font-semibold text-primary-600">{evaluation.technicalSkills}</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Communication (1-5)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={evaluation.communication}
                                    onChange={(e) => setEvaluation({ ...evaluation, communication: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-600 mt-1">
                                    <span>Poor</span>
                                    <span className="font-semibold text-primary-600">{evaluation.communication}</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Fit (1-5)
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={evaluation.Fit}
                                    onChange={(e) => setEvaluation({ ...evaluation, Fit: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-600 mt-1">
                                    <span>Poor</span>
                                    <span className="font-semibold text-primary-600">{evaluation.Fit}</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={evaluation.notes}
                                    onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })}
                                    className="input-field min-h-[100px]"
                                    placeholder="Add your evaluation notes here..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSelect}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    ✓ Select Candidate
                                </button>
                                <button
                                    onClick={handleRejectAfterInterview}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    ✕ Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResumeScreening

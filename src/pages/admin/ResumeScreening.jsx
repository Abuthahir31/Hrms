import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../config/firebase'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

function ResumeScreening() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedApp, setSelectedApp] = useState(null)
    const [showInterviewModal, setShowInterviewModal] = useState(false)
    const [showEvaluationModal, setShowEvaluationModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
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

    const handleViewDetails = (app) => {
        setSelectedApp(app)
        setShowDetailsModal(true)
    }

    const downloadApplicationPDF = (app) => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setTextColor(59, 130, 246) // Blue color
        doc.text('Job Application Details', 14, 20)

        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

        let yPos = 40

        // Personal Information
        doc.setFontSize(14)
        doc.setTextColor(37, 99, 235)
        doc.text('Personal Information', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        const personalInfo = [
            ['Full Name', app.personalDetails?.fullName || 'N/A'],
            ['Email', app.personalDetails?.email || 'N/A'],
            ['Phone', app.personalDetails?.phone || 'N/A'],
            ['Address', app.personalDetails?.address || 'N/A'],
            ['Applied For', app.jobTitle || 'N/A'],
            ['Application Date', app.appliedAt ? new Date(app.appliedAt.toDate()).toLocaleDateString() : 'N/A'],
            ['Status', app.status || 'pending']
        ]

        doc.autoTable({
            startY: yPos,
            body: personalInfo,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { cellWidth: 130 }
            }
        })

        yPos = doc.lastAutoTable.finalY + 10

        // Education
        if (app.education && app.education.length > 0) {
            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235)
            doc.text('Education', 14, yPos)
            yPos += 8

            app.education.forEach((edu, index) => {
                const eduData = [
                    ['Degree Level', edu.degreeLevel || 'N/A'],
                    ['Institution', edu.institution || 'N/A'],
                    ['Field of Study', edu.fieldOfStudy || 'N/A'],
                    ['Year of Completion', edu.yearOfCompletion || 'N/A'],
                    ['Grade/CGPA', edu.grade || 'N/A']
                ]

                doc.setFontSize(11)
                doc.setTextColor(0, 0, 0)
                doc.text(`Education ${index + 1}`, 14, yPos)
                yPos += 5

                doc.autoTable({
                    startY: yPos,
                    body: eduData,
                    theme: 'plain',
                    styles: { fontSize: 9, cellPadding: 1.5 },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 50 },
                        1: { cellWidth: 130 }
                    }
                })

                yPos = doc.lastAutoTable.finalY + 5
            })

            yPos += 5
        }

        // Work Experience
        if (app.experience && app.experience.length > 0 && app.experience[0].company) {
            // Check if new page needed
            if (yPos > 250) {
                doc.addPage()
                yPos = 20
            }

            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235)
            doc.text('Work Experience', 14, yPos)
            yPos += 8

            app.experience.forEach((exp, index) => {
                if (exp.company) {
                    const expData = [
                        ['Company', exp.company || 'N/A'],
                        ['Position', exp.position || 'N/A'],
                        ['Duration', exp.duration || 'N/A'],
                        ['Description', exp.description || 'N/A']
                    ]

                    doc.setFontSize(11)
                    doc.setTextColor(0, 0, 0)
                    doc.text(`Experience ${index + 1}`, 14, yPos)
                    yPos += 5

                    doc.autoTable({
                        startY: yPos,
                        body: expData,
                        theme: 'plain',
                        styles: { fontSize: 9, cellPadding: 1.5 },
                        columnStyles: {
                            0: { fontStyle: 'bold', cellWidth: 50 },
                            1: { cellWidth: 130 }
                        }
                    })

                    yPos = doc.lastAutoTable.finalY + 5
                }
            })

            yPos += 5
        }

        // Skills
        if (app.skills) {
            if (yPos > 250) {
                doc.addPage()
                yPos = 20
            }

            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235)
            doc.text('Skills', 14, yPos)
            yPos += 8

            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            const skillsArray = Array.isArray(app.skills) ? app.skills : app.skills.split(',').map(s => s.trim())
            const skillsText = skillsArray.join(', ')
            const splitSkills = doc.splitTextToSize(skillsText, 180)
            doc.text(splitSkills, 14, yPos)
            yPos += splitSkills.length * 5 + 10
        }

        // Cover Letter
        if (app.coverLetter) {
            if (yPos > 220) {
                doc.addPage()
                yPos = 20
            }

            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235)
            doc.text('Cover Letter', 14, yPos)
            yPos += 8

            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            const splitCoverLetter = doc.splitTextToSize(app.coverLetter, 180)
            doc.text(splitCoverLetter, 14, yPos)
            yPos += splitCoverLetter.length * 5 + 10
        }

        // Portfolio Link
        if (app.portfolioLink) {
            if (yPos > 270) {
                doc.addPage()
                yPos = 20
            }

            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235)
            doc.text('Portfolio', 14, yPos)
            yPos += 8

            doc.setFontSize(10)
            doc.setTextColor(37, 99, 235)
            doc.textWithLink(app.portfolioLink, 14, yPos, { url: app.portfolioLink })
        }

        // Save PDF
        const fileName = `${app.personalDetails?.fullName?.replace(/\s+/g, '_')}_Application.pdf`
        doc.save(fileName)
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

                                    {/* View All Details Button */}
                                    <button
                                        onClick={() => handleViewDetails(app)}
                                        className="btn-primary text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View All Details
                                    </button>

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

            {/* View All Details Modal */}
            {showDetailsModal && selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                                <p className="text-sm text-gray-600 mt-1">{selectedApp.personalDetails?.fullName}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => downloadApplicationPDF(selectedApp)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Personal Information */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">Full Name</p>
                                        <p className="text-gray-900">{selectedApp.personalDetails?.fullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">Email</p>
                                        <p className="text-gray-900">{selectedApp.personalDetails?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">Phone</p>
                                        <p className="text-gray-900">{selectedApp.personalDetails?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">Address</p>
                                        <p className="text-gray-900">{selectedApp.personalDetails?.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">Applied For</p>
                                        <p className="text-gray-900 font-semibold">{selectedApp.jobTitle || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">Application Date</p>
                                        <p className="text-gray-900">
                                            {selectedApp.appliedAt ? new Date(selectedApp.appliedAt.toDate()).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Education */}
                            {selectedApp.education && selectedApp.education.length > 0 && (
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                                    <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Education History
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedApp.education.map((edu, index) => (
                                            <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                                                <p className="font-semibold text-purple-900 mb-2">Education {index + 1}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="font-semibold text-purple-700">Degree: </span>
                                                        <span className="text-gray-900">{edu.degreeLevel || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-purple-700">Institution: </span>
                                                        <span className="text-gray-900">{edu.institution || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-purple-700">Field: </span>
                                                        <span className="text-gray-900">{edu.fieldOfStudy || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-purple-700">Year: </span>
                                                        <span className="text-gray-900">{edu.yearOfCompletion || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-purple-700">Grade/CGPA: </span>
                                                        <span className="text-gray-900">{edu.grade || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Work Experience */}
                            {selectedApp.experience && selectedApp.experience.length > 0 && selectedApp.experience[0].company && (
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Work Experience
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedApp.experience.map((exp, index) => (
                                            exp.company && (
                                                <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                                                    <p className="font-semibold text-green-900 mb-2">Experience {index + 1}</p>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-semibold text-green-700">Company: </span>
                                                            <span className="text-gray-900">{exp.company}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-green-700">Position: </span>
                                                            <span className="text-gray-900">{exp.position || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-green-700">Duration: </span>
                                                            <span className="text-gray-900">{exp.duration || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-green-700">Description: </span>
                                                            <p className="text-gray-900 mt-1">{exp.description || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {selectedApp.skills && (
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                                    <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                        Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(selectedApp.skills)
                                            ? selectedApp.skills
                                            : selectedApp.skills.split(',').map(s => s.trim())
                                        ).map((skill, index) => (
                                            <span key={index} className="px-3 py-1 bg-orange-200 text-orange-900 rounded-full text-sm font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cover Letter */}
                            {selectedApp.coverLetter && (
                                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200">
                                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Cover Letter
                                    </h3>
                                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                                        <p className="text-gray-900 whitespace-pre-wrap">{selectedApp.coverLetter}</p>
                                    </div>
                                </div>
                            )}

                            {/* Portfolio Link */}
                            {selectedApp.portfolioLink && (
                                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border-2 border-pink-200">
                                    <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        Portfolio
                                    </h3>
                                    <a
                                        href={selectedApp.portfolioLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-pink-700 hover:text-pink-900 underline break-all"
                                    >
                                        {selectedApp.portfolioLink}
                                    </a>
                                </div>
                            )}

                            {/* Resume Download */}
                            {selectedApp.resumeUrl && (
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Resume
                                    </h3>
                                    <a
                                        href={selectedApp.resumeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Resume
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-2xl">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResumeScreening

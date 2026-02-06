import { useState, useEffect } from 'react'
import EducationEntry from '../../components/user/EducationEntry'
import WorkExperienceEntry from '../../components/user/WorkExperienceEntry'
import UserLogin from '../../components/user/UserLogin'
import { useAuth } from '../../context/AuthContext'
import { uploadResume, submitApplication, sendConfirmationEmail } from '../../services/applicationService'

import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'

function UserHome() {
    const { currentUser } = useAuth()
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedJobId, setExpandedJobId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [applicationData, setApplicationData] = useState({
        // Personal Details
        fullName: '',
        email: '',
        phone: '',
        address: '',

        // Education (array of education entries)
        education: [{
            degreeLevel: '',
            institution: '',
            fieldOfStudy: '',
            yearOfCompletion: '',
            grade: ''
        }],

        // Experience (array of work experience entries - OPTIONAL)
        experience: [{
            company: '',
            position: '',
            duration: '',
            description: ''
        }],

        // Skills
        skills: '',

        // Files and Links
        resume: null,
        coverLetter: '',
        portfolioLink: ''
    })

    // Fetch jobs from Firestore
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const jobsRef = collection(db, 'job_postings')
                const q = query(jobsRef, orderBy('postedDate', 'desc'))
                const querySnapshot = await getDocs(q)
                const jobsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))

                // Filter out expired jobs - only show active jobs to users
                const now = new Date()
                const activeJobs = jobsList.filter(job => {
                    if (!job.expiryDateTime) return true // No expiry = always active
                    return new Date(job.expiryDateTime) > now // Only show if not expired
                })

                setJobs(activeJobs)
            } catch (error) {
                console.error('Error fetching jobs:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchJobs()
    }, [])

    const handleApply = (jobId) => {
        if (!currentUser) {
            setShowLoginModal(true)
            return
        }
        setExpandedJobId(expandedJobId === jobId ? null : jobId)
        if (expandedJobId !== jobId) {
            // Reset form when opening
            setApplicationData({
                fullName: '',
                email: '',
                phone: '',
                address: '',
                education: [{
                    degreeLevel: '',
                    institution: '',
                    fieldOfStudy: '',
                    yearOfCompletion: '',
                    grade: ''
                }],
                experience: [{
                    company: '',
                    position: '',
                    duration: '',
                    description: ''
                }],
                skills: '',
                resume: null,
                coverLetter: '',
                portfolioLink: ''
            })
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setApplicationData({
            ...applicationData,
            [name]: value
        })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]

        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB')
                e.target.value = ''
                return
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if (!allowedTypes.includes(file.type)) {
                alert('Only PDF, DOC, and DOCX files are allowed')
                e.target.value = ''
                return
            }

            setApplicationData({
                ...applicationData,
                resume: file
            })
        }
    }

    // Education handlers
    const handleEducationChange = (index, updatedEducation) => {
        const newEducation = [...applicationData.education]
        newEducation[index] = updatedEducation
        setApplicationData({
            ...applicationData,
            education: newEducation
        })
    }

    const addEducation = () => {
        setApplicationData({
            ...applicationData,
            education: [
                ...applicationData.education,
                {
                    degreeLevel: '',
                    institution: '',
                    fieldOfStudy: '',
                    yearOfCompletion: '',
                    grade: ''
                }
            ]
        })
    }

    const removeEducation = (index) => {
        const newEducation = applicationData.education.filter((_, i) => i !== index)
        setApplicationData({
            ...applicationData,
            education: newEducation
        })
    }

    // Work Experience handlers
    const handleExperienceChange = (index, updatedExperience) => {
        const newExperience = [...applicationData.experience]
        newExperience[index] = updatedExperience
        setApplicationData({
            ...applicationData,
            experience: newExperience
        })
    }

    const addExperience = () => {
        setApplicationData({
            ...applicationData,
            experience: [
                ...applicationData.experience,
                {
                    company: '',
                    position: '',
                    duration: '',
                    description: ''
                }
            ]
        })
    }

    const removeExperience = (index) => {
        const newExperience = applicationData.experience.filter((_, i) => i !== index)
        setApplicationData({
            ...applicationData,
            experience: newExperience
        })
    }

    const handleSubmitApplication = async (e, job) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // 1. Upload resume to Firebase Storage
            let resumeUrl = ''
            if (applicationData.resume) {
                resumeUrl = await uploadResume(applicationData.resume, applicationData.email)
            }

            // 2. Prepare application data
            const submissionData = {
                jobId: job.id,
                jobTitle: job.jobTitle,
                personalDetails: {
                    fullName: applicationData.fullName,
                    email: applicationData.email,
                    phone: applicationData.phone,
                    address: applicationData.address
                },
                education: applicationData.education,
                experience: applicationData.experience,
                skills: applicationData.skills.split(',').map(s => s.trim()).filter(s => s),
                resumeUrl: resumeUrl,
                coverLetter: applicationData.coverLetter,
                portfolioLink: applicationData.portfolioLink
            }

            // 3. Submit to Firestore
            const applicationId = await submitApplication(submissionData)

            // 4. Send confirmation email
            await sendConfirmationEmail(
                applicationData.email,
                applicationData.fullName,
                job.jobTitle
            )

            // 5. Show success message
            alert(`✅ Application submitted successfully!

Application ID: ${applicationId}

We've sent a confirmation email to ${applicationData.email}.
Our team will review your application and get back to you soon.`)

            // 6. Reset form
            setApplicationData({
                fullName: '',
                email: '',
                phone: '',
                address: '',
                education: [{
                    degreeLevel: '',
                    institution: '',
                    fieldOfStudy: '',
                    yearOfCompletion: '',
                    grade: ''
                }],
                experience: [{
                    company: '',
                    position: '',
                    duration: '',
                    description: ''
                }],
                skills: '',
                resume: null,
                coverLetter: '',
                portfolioLink: ''
            })
            setExpandedJobId(null)

        } catch (error) {
            console.error('Error submitting application:', error)
            alert(`❌ Error: ${error.message}

Please try again or contact support if the problem persists.`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    Explore Career Opportunities
                </h1>
                <p className="text-lg text-gray-600">
                    Find your dream job and take the next step in your career journey
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
                            <p className="text-sm font-medium text-gray-700">Open Positions</p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-purple-600">{new Set(jobs.map(j => j.department)).size}</p>
                            <p className="text-sm font-medium text-gray-700">Departments</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-600">{new Set(jobs.map(j => j.location)).size}</p>
                            <p className="text-sm font-medium text-gray-700">Locations</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Listings */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Positions</h2>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading career opportunities...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="card text-center py-16">
                        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No job openings available</h3>
                        <p className="text-gray-600">Check back later for new opportunities</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className={`card transition-all duration-500 overflow-hidden ${expandedJobId === job.id ? 'border-blue-400 shadow-xl' : 'hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-bold text-xl">
                                                    {job.department.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {job.jobTitle}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                        {job.department}
                                                    </span>
                                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                                        {job.employmentType}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-700 mb-4 leading-relaxed">{job.jobDescription}</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="font-medium">{job.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">{job.experience}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">
                                                    ₹{parseInt(job.salaryMin).toLocaleString()} - ₹{parseInt(job.salaryMax).toLocaleString()} / year
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 mb-2">Key Requirements:</p>
                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {job.requirements.slice(0, 4).map((req, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span>{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {job.requirements.length > 4 && (
                                                <p className="text-sm text-gray-500 mt-2">+{job.requirements.length - 4} more requirements</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:w-48 flex-shrink-0">
                                        <button
                                            onClick={() => handleApply(job.id)}
                                            className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 ${expandedJobId === job.id
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {expandedJobId === job.id ? (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Cancel
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Apply Now
                                                </>
                                            )}
                                        </button>
                                        <p className="text-xs text-gray-500 text-center mt-3">
                                            Posted {new Date(job.postedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Expandable Application Form */}
                                <div
                                    className={`transition-all duration-500 ease-in-out ${expandedJobId === job.id
                                        ? 'max-h-[5000px] opacity-100 mt-6 pt-6 border-t-2 border-blue-200'
                                        : 'max-h-0 opacity-0 overflow-hidden'
                                        }`}
                                >
                                    <div className="animate-fadeIn">
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Form</h3>
                                            <p className="text-gray-600">Fill in your details to apply for {job.jobTitle}</p>
                                        </div>

                                        <form onSubmit={(e) => handleSubmitApplication(e, job)} className="space-y-8">
                                            {/* Personal Details Section */}
                                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Personal Details
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Full Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="fullName"
                                                            value={applicationData.fullName}
                                                            onChange={handleInputChange}
                                                            className="input-field"
                                                            placeholder="John Doe"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Email Address <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={applicationData.email}
                                                            onChange={handleInputChange}
                                                            className="input-field"
                                                            placeholder="john@example.com"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Phone Number <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={applicationData.phone}
                                                            onChange={handleInputChange}
                                                            className="input-field"
                                                            placeholder="+1 (555) 123-4567"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Address
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="address"
                                                            value={applicationData.address}
                                                            onChange={handleInputChange}
                                                            className="input-field"
                                                            placeholder="City, State, Country"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Education Section */}
                                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                                    </svg>
                                                    Education
                                                </h4>

                                                <div className="space-y-4">
                                                    {applicationData.education.map((edu, index) => (
                                                        <EducationEntry
                                                            key={index}
                                                            education={edu}
                                                            index={index}
                                                            onChange={handleEducationChange}
                                                            onRemove={removeEducation}
                                                            canRemove={applicationData.education.length > 1}
                                                        />
                                                    ))}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addEducation}
                                                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Add Education
                                                </button>
                                            </div>

                                            {/* Experience Section */}
                                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Work Experience
                                                    <span className="text-sm font-normal text-gray-500">(Optional)</span>
                                                </h4>

                                                <div className="space-y-4">
                                                    {applicationData.experience.map((exp, index) => (
                                                        <WorkExperienceEntry
                                                            key={index}
                                                            experience={exp}
                                                            index={index}
                                                            onChange={handleExperienceChange}
                                                            onRemove={removeExperience}
                                                            canRemove={applicationData.experience.length > 1}
                                                        />
                                                    ))}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addExperience}
                                                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Add Work Experience
                                                </button>
                                            </div>

                                            {/* Skills Section */}
                                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                    Skills
                                                </h4>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Your Skills <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="skills"
                                                        value={applicationData.skills}
                                                        onChange={handleInputChange}
                                                        className="input-field"
                                                        placeholder="e.g., JavaScript, React, Node.js, Python (comma separated)"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                                                </div>
                                            </div>

                                            {/* Resume Upload */}
                                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    Resume Upload
                                                </h4>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Upload Resume / CV <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={handleFileChange}
                                                        className="input-field"
                                                        required
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Accepted formats: PDF, DOC, DOCX (Max 5MB)
                                                    </p>
                                                    {applicationData.resume && (
                                                        <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {applicationData.resume.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cover Letter & Portfolio */}
                                            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
                                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Additional Information
                                                </h4>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Cover Letter <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                            name="coverLetter"
                                                            value={applicationData.coverLetter}
                                                            onChange={handleInputChange}
                                                            className="input-field min-h-[150px]"
                                                            placeholder="Tell us why you're a great fit for this position..."
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Portfolio Link <span className="text-gray-500">(Optional)</span>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            name="portfolioLink"
                                                            value={applicationData.portfolioLink}
                                                            onChange={handleInputChange}
                                                            className="input-field"
                                                            placeholder="https://yourportfolio.com"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Position Summary */}
                                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 mb-2">Position Summary</h4>
                                                <div className="space-y-1 text-sm text-gray-700">
                                                    <p><span className="font-medium">Department:</span> {job.department}</p>
                                                    <p><span className="font-medium">Type:</span> {job.employmentType}</p>
                                                    <p><span className="font-medium">Location:</span> {job.location}</p>
                                                    <p><span className="font-medium">Salary:</span> ₹{parseInt(job.salaryMin).toLocaleString()} - ₹{parseInt(job.salaryMax).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Submit Buttons */}
                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    type="submit"
                                                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <svg className="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Submit Application
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedJobId(null)}
                                                    className="flex-1 btn-secondary"
                                                    disabled={isSubmitting}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Login Modal */}
            <UserLogin isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </div>
    )
}

export default UserHome

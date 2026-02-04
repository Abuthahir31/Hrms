import { useState, useEffect } from 'react'

function Recruitment() {
    const [jobs, setJobs] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [viewJob, setViewJob] = useState(null)
    const [editingJob, setEditingJob] = useState(null)
    const [requirements, setRequirements] = useState([''])

    const [formData, setFormData] = useState({
        jobTitle: '',
        department: '',
        employmentType: '',
        location: '',
        jobDescription: '',
        experience: '',
        salaryMin: '',
        salaryMax: ''
    })

    // Load jobs from localStorage on mount
    useEffect(() => {
        const savedJobs = localStorage.getItem('hrms_jobs')
        if (savedJobs) {
            setJobs(JSON.parse(savedJobs))
        }
    }, [])

    // Save jobs to localStorage whenever they change
    useEffect(() => {
        if (jobs.length > 0) {
            localStorage.setItem('hrms_jobs', JSON.stringify(jobs))
        }
    }, [jobs])

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleRequirementChange = (index, value) => {
        const newRequirements = [...requirements]
        newRequirements[index] = value
        setRequirements(newRequirements)
    }

    const addRequirement = () => {
        setRequirements([...requirements, ''])
    }

    const removeRequirement = (index) => {
        const newRequirements = requirements.filter((_, i) => i !== index)
        setRequirements(newRequirements.length > 0 ? newRequirements : [''])
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const newJob = {
            id: editingJob ? editingJob.id : Date.now(),
            ...formData,
            requirements: requirements.filter(req => req.trim() !== ''),
            postedDate: editingJob ? editingJob.postedDate : new Date().toISOString()
        }

        if (editingJob) {
            setJobs(jobs.map(job => job.id === editingJob.id ? newJob : job))
        } else {
            setJobs([...jobs, newJob])
        }

        // Reset form
        setFormData({
            jobTitle: '',
            department: '',
            employmentType: '',
            location: '',
            jobDescription: '',
            experience: '',
            salaryMin: '',
            salaryMax: ''
        })
        setRequirements([''])
        setEditingJob(null)
    }

    const handleEdit = (job) => {
        setEditingJob(job)
        setFormData({
            jobTitle: job.jobTitle,
            department: job.department,
            employmentType: job.employmentType,
            location: job.location,
            jobDescription: job.jobDescription,
            experience: job.experience,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax
        })
        setRequirements(job.requirements.length > 0 ? job.requirements : [''])
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this job posting?')) {
            setJobs(jobs.filter(job => job.id !== id))
        }
    }

    const handleView = (job) => {
        setViewJob(job)
        setShowModal(true)
    }

    const cancelEdit = () => {
        setEditingJob(null)
        setFormData({
            jobTitle: '',
            department: '',
            employmentType: '',
            location: '',
            jobDescription: '',
            experience: '',
            salaryMin: '',
            salaryMax: ''
        })
        setRequirements([''])
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruitment Management</h1>
                <p className="text-gray-600">Post and manage job openings for your organization</p>
            </div>

            {/* Job Posting Form */}
            <div className="card mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Job Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Job Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="jobTitle"
                                value={formData.jobTitle}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., Senior Software Engineer"
                                required
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Human Resources">Human Resources</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Sales">Sales</option>
                                <option value="Finance">Finance</option>
                                <option value="Operations">Operations</option>
                                <option value="Customer Support">Customer Support</option>
                            </select>
                        </div>

                        {/* Employment Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Employment Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., New York, NY (Remote)"
                                required
                            />
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Experience Required <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="experience"
                                value={formData.experience}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., 3-5 years"
                                required
                            />
                        </div>

                        {/* Salary Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Min Salary <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="salaryMin"
                                    value={formData.salaryMin}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    placeholder="50000"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Salary <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="salaryMax"
                                    value={formData.salaryMax}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    placeholder="80000"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="jobDescription"
                            value={formData.jobDescription}
                            onChange={handleInputChange}
                            className="input-field min-h-[120px]"
                            placeholder="Describe the role, responsibilities, and what makes this position unique..."
                            required
                        />
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Requirements <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            {requirements.map((req, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={req}
                                        onChange={(e) => handleRequirementChange(index, e.target.value)}
                                        className="input-field flex-1"
                                        placeholder={`Requirement ${index + 1}`}
                                        required
                                    />
                                    {requirements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRequirement(index)}
                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addRequirement}
                                className="btn-secondary text-sm"
                            >
                                + Add Requirement
                            </button>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="btn-primary">
                            {editingJob ? 'Update Job Posting' : 'Post Job'}
                        </button>
                        {editingJob && (
                            <button type="button" onClick={cancelEdit} className="btn-secondary">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Posted Jobs */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Posted Jobs ({jobs.length})
                </h2>

                {jobs.length === 0 ? (
                    <div className="card text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
                        <p className="text-gray-600">Create your first job posting using the form above</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {jobs.map((job) => (
                            <div key={job.id} className="card group hover:border-primary-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{job.jobTitle}</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                                                {job.department}
                                            </span>
                                            <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-semibold">
                                                {job.employmentType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{job.experience} experience</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>₹{parseInt(job.salaryMin).toLocaleString()} - ₹{parseInt(job.salaryMax).toLocaleString()}</span>
                                    </div>
                                </div>

                                <p className="text-gray-700 mb-4 line-clamp-2">{job.jobDescription}</p>

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleView(job)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleEdit(job)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(job.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Job Modal */}
            {showModal && viewJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-3">{viewJob.jobTitle}</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                                        {viewJob.department}
                                    </span>
                                    <span className="px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-semibold">
                                        {viewJob.employmentType}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Location</p>
                                    <p className="font-semibold text-gray-900">{viewJob.location}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Experience</p>
                                    <p className="font-semibold text-gray-900">{viewJob.experience}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-gray-600 mb-1">Salary Range</p>
                                    <p className="font-semibold text-gray-900">
                                        ${parseInt(viewJob.salaryMin).toLocaleString()} - ${parseInt(viewJob.salaryMax).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-3">Job Description</h4>
                                <p className="text-gray-700 leading-relaxed">{viewJob.jobDescription}</p>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-3">Requirements</h4>
                                <ul className="space-y-2">
                                    {viewJob.requirements.map((req, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                                            <span className="text-gray-700">{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500">
                                    Posted on {new Date(viewJob.postedDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Recruitment

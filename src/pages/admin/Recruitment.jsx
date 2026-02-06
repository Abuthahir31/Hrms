import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'

function Recruitment() {
    const [activeTab, setActiveTab] = useState('active')
    const [jobs, setJobs] = useState([])
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)

    // Job Form State
    const [showJobModal, setShowJobModal] = useState(false)
    const [viewJob, setViewJob] = useState(null)
    const [editingJob, setEditingJob] = useState(null)
    const [jobRequirements, setJobRequirements] = useState([''])
    const [jobFormData, setJobFormData] = useState({
        jobTitle: '',
        department: '',
        employmentType: '',
        location: '',
        jobDescription: '',
        experience: '',
        salaryMin: '',
        salaryMax: '',
        expiryDateTime: ''
    })

    // Department Form State
    const [newDepartmentName, setNewDepartmentName] = useState('')
    const [deptLoading, setDeptLoading] = useState(false)

    // Fetch Initial Data
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchJobs(), fetchDepartments()])
        setLoading(false)
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

    // --- Department Handlers ---

    const handleCreateDepartment = async (e) => {
        e.preventDefault()
        if (!newDepartmentName.trim()) return

        try {
            setDeptLoading(true)
            await addDoc(collection(db, 'departments'), {
                name: newDepartmentName.trim(),
                createdAt: new Date().toISOString()
            })
            setNewDepartmentName('')
            await fetchDepartments()
            alert('Department created successfully!')
        } catch (error) {
            console.error('Error creating department:', error)
            alert('Failed to create department')
        } finally {
            setDeptLoading(false)
        }
    }

    const handleDeleteDepartment = async (id) => {
        if (!window.confirm('Are you sure? This will not delete jobs associated with this department.')) return
        try {
            await deleteDoc(doc(db, 'departments', id))
            await fetchDepartments()
        } catch (error) {
            console.error('Error deleting department:', error)
            alert('Failed to delete department')
        }
    }

    // --- Job Handlers ---

    const handleJobInputChange = (e) => {
        setJobFormData({
            ...jobFormData,
            [e.target.name]: e.target.value
        })
    }

    const handleRequirementChange = (index, value) => {
        const newReqs = [...jobRequirements]
        newReqs[index] = value
        setJobRequirements(newReqs)
    }

    const addRequirement = () => {
        setJobRequirements([...jobRequirements, ''])
    }

    const removeRequirement = (index) => {
        const newReqs = jobRequirements.filter((_, i) => i !== index)
        setJobRequirements(newReqs.length > 0 ? newReqs : [''])
    }

    const handleJobSubmit = async (e) => {
        e.preventDefault()

        try {
            const jobData = {
                ...jobFormData,
                requirements: jobRequirements.filter(req => req.trim() !== ''),
                postedDate: editingJob ? editingJob.postedDate : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            if (editingJob) {
                await updateDoc(doc(db, 'job_postings', editingJob.id), jobData)
                alert('Job updated successfully!')
            } else {
                await addDoc(collection(db, 'job_postings'), jobData)
                alert('Job posted successfully!')
            }

            // Reset and fetch
            resetJobForm()
            await fetchJobs()
        } catch (error) {
            console.error('Error saving job:', error)
            alert('Failed to save job posting')
        }
    }

    const handleDeleteJob = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job posting?')) return
        try {
            await deleteDoc(doc(db, 'job_postings', id))
            setJobs(jobs.filter(job => job.id !== id))
        } catch (error) {
            console.error('Error deleting job:', error)
            alert('Failed to delete job')
        }
    }

    const handleEditJob = (job) => {
        setEditingJob(job)
        setJobFormData({
            jobTitle: job.jobTitle,
            department: job.department,
            employmentType: job.employmentType,
            location: job.location,
            jobDescription: job.jobDescription,
            experience: job.experience,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            expiryDateTime: job.expiryDateTime || ''
        })
        setJobRequirements(job.requirements && job.requirements.length > 0 ? job.requirements : [''])
        setShowJobModal(true) // Reuse modal or scroll to form? Let's use logic to show form
    }

    const resetJobForm = () => {
        setJobFormData({
            jobTitle: '',
            department: '',
            employmentType: '',
            location: '',
            jobDescription: '',
            experience: '',
            salaryMin: '',
            salaryMax: '',
            expiryDateTime: ''
        })
        setJobRequirements([''])
        setEditingJob(null)
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruitment Management</h1>
                <p className="text-gray-600">Manage departments and job openings</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'active'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Active Jobs ({jobs.filter(job => !job.expiryDateTime || new Date(job.expiryDateTime) > new Date()).length})
                </button>
                <button
                    onClick={() => setActiveTab('expired')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'expired'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Expired Jobs ({jobs.filter(job => job.expiryDateTime && new Date(job.expiryDateTime) <= new Date()).length})
                </button>
                <button
                    onClick={() => setActiveTab('departments')}
                    className={`px-6 py-3 font-semibold transition-colors border-b-2 ${activeTab === 'departments'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Departments
                </button>
            </div>

            {/* Content */}
            {activeTab === 'departments' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Create Department Form */}
                    <div className="md:col-span-1">
                        <div className="card sticky top-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Department</h2>
                            <form onSubmit={handleCreateDepartment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Department Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newDepartmentName}
                                        onChange={(e) => setNewDepartmentName(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. Engineering"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn-primary w-full"
                                    disabled={deptLoading}
                                >
                                    {deptLoading ? 'Creating...' : 'Create Department'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Department List */}
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Existing Departments ({departments.length})</h2>
                        {departments.length === 0 ? (
                            <p className="text-gray-500 italic">No departments created yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {departments.map(dept => (
                                    <div key={dept.id} className="card flex justify-between items-center p-4">
                                        <span className="font-semibold text-gray-800">{dept.name}</span>
                                        <button
                                            onClick={() => handleDeleteDepartment(dept.id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Delete Department"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(activeTab === 'active' || activeTab === 'expired') && (
                <div className="space-y-8">
                    {/* Job Form - Only show in Active tab */}
                    {activeTab === 'active' && (
                        <div className="card">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                            </h2>

                            {departments.length === 0 ? (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <p className="text-yellow-700">
                                        Please create at least one department in the <strong>Departments</strong> tab before posting a job.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleJobSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Job Title */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Job Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="jobTitle"
                                                value={jobFormData.jobTitle}
                                                onChange={handleJobInputChange}
                                                className="input-field"
                                                placeholder="e.g., Senior Software Engineer"
                                                required
                                            />
                                        </div>

                                        {/* Department Dropdown */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Department <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="department"
                                                value={jobFormData.department}
                                                onChange={handleJobInputChange}
                                                className="input-field"
                                                required
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Employment Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Employment Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="employmentType"
                                                value={jobFormData.employmentType}
                                                onChange={handleJobInputChange}
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
                                                value={jobFormData.location}
                                                onChange={handleJobInputChange}
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
                                                value={jobFormData.experience}
                                                onChange={handleJobInputChange}
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
                                                    value={jobFormData.salaryMin}
                                                    onChange={handleJobInputChange}
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
                                                    value={jobFormData.salaryMax}
                                                    onChange={handleJobInputChange}
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
                                            value={jobFormData.jobDescription}
                                            onChange={handleJobInputChange}
                                            className="input-field min-h-[120px]"
                                            placeholder="Describe the role, responsibilities, and what makes this position unique..."
                                            required
                                        />
                                    </div>

                                    {/* Expiry Date & Time */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Job Expiry Date & Time <span className="text-gray-500 text-xs">(Optional)</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="expiryDateTime"
                                            value={jobFormData.expiryDateTime}
                                            onChange={handleJobInputChange}
                                            className="input-field"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Leave empty if the job should never expire. After expiry, the job will be hidden from users and moved to the Expired tab.
                                        </p>
                                    </div>

                                    {/* Requirements */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Requirements <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-3">
                                            {jobRequirements.map((req, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={req}
                                                        onChange={(e) => handleRequirementChange(index, e.target.value)}
                                                        className="input-field flex-1"
                                                        placeholder={`Requirement ${index + 1}`}
                                                        required
                                                    />
                                                    {jobRequirements.length > 1 && (
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
                                            <button
                                                type="button"
                                                onClick={resetJobForm}
                                                className="btn-secondary"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Posted Jobs List */}
                    <div>
                        {(() => {
                            const now = new Date()
                            const filteredJobs = jobs.filter(job => {
                                if (activeTab === 'active') {
                                    return !job.expiryDateTime || new Date(job.expiryDateTime) > now
                                } else if (activeTab === 'expired') {
                                    return job.expiryDateTime && new Date(job.expiryDateTime) <= now
                                }
                                return false
                            })

                            return (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                        {activeTab === 'active' ? 'Active Jobs' : 'Expired Jobs'} ({filteredJobs.length})
                                    </h2>
                                    {loading ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                                        </div>
                                    ) : filteredJobs.length === 0 ? (
                                        <div className="card text-center py-12">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                {activeTab === 'active' ? 'No active jobs' : 'No expired jobs'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {activeTab === 'active'
                                                    ? 'Create your first job posting using the form above'
                                                    : 'Jobs that have passed their expiry date will appear here'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {filteredJobs.map((job) => {
                                                const isExpired = job.expiryDateTime && new Date(job.expiryDateTime) <= new Date()
                                                const expiryDate = job.expiryDateTime ? new Date(job.expiryDateTime) : null

                                                return (
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
                                                                    {isExpired ? (
                                                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                                                            ⏰ Expired
                                                                        </span>
                                                                    ) : expiryDate ? (
                                                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                                            ✓ Active
                                                                        </span>
                                                                    ) : null}
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
                                                            {expiryDate && (
                                                                <div className={`flex items-center gap-2 ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="font-medium">
                                                                        {isExpired ? 'Expired on: ' : 'Expires on: '}
                                                                        {expiryDate.toLocaleString('en-IN', {
                                                                            dateStyle: 'medium',
                                                                            timeStyle: 'short'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <p className="text-gray-700 mb-4 line-clamp-2">{job.jobDescription}</p>

                                                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                                                            <button
                                                                onClick={() => {
                                                                    setViewJob(job)
                                                                    // setShowModal(true) Need to implement modal if kept
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditJob(job)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteJob(job.id)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                </div>
            )}

            {/* Keeping View Modal if needed, but for now simple view is fine or minimal impl. 
                I'll add the modal back for completeness since it was there. 
            */}
            {viewJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                            <button
                                onClick={() => setViewJob(null)}
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
                                        ₹{parseInt(viewJob.salaryMin).toLocaleString()} - ₹{parseInt(viewJob.salaryMax).toLocaleString()}
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
                                    {viewJob.requirements && viewJob.requirements.map((req, index) => (
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
            )
            }
        </div >
    )
}

export default Recruitment

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../config/firebase'

function OfferLetter() {
    const { applicationId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [isEditMode, setIsEditMode] = useState(true)

    // Application and candidate data
    const [applicationData, setApplicationData] = useState(null)
    const [existingOffer, setExistingOffer] = useState(null)

    // Offer letter form data
    const [offerData, setOfferData] = useState({
        salary: '',
        role: '',
        department: '',
        joiningDate: '',
        location: '',
        additionalTerms: ''
    })

    useEffect(() => {
        fetchData()
    }, [applicationId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch application data
            const appRef = doc(db, 'job_applications', applicationId)
            const appSnap = await getDoc(appRef)

            if (appSnap.exists()) {
                const appData = { id: appSnap.id, ...appSnap.data() }
                setApplicationData(appData)

                // Pre-fill some fields from application
                setOfferData(prev => ({
                    ...prev,
                    role: appData.jobTitle || '',
                    department: appData.department || ''
                }))
            }

            // Check if offer letter already exists
            const offersRef = collection(db, 'offer_letters')
            const offerQuery = await getDoc(doc(offersRef, applicationId))

            if (offerQuery.exists()) {
                const offerLetterData = offerQuery.data()
                setExistingOffer({ id: offerQuery.id, ...offerLetterData })
                setOfferData({
                    salary: offerLetterData.salary || '',
                    role: offerLetterData.role || '',
                    department: offerLetterData.department || '',
                    joiningDate: offerLetterData.joiningDate || '',
                    location: offerLetterData.location || '',
                    additionalTerms: offerLetterData.additionalTerms || ''
                })
                setIsEditMode(false)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            alert('Failed to load application data')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        setOfferData({
            ...offerData,
            [e.target.name]: e.target.value
        })
    }

    const handleSaveDraft = async () => {
        try {
            setSaving(true)

            const offerLetterData = {
                applicationId,
                candidateName: applicationData.personalDetails.fullName,
                candidateEmail: applicationData.personalDetails.email,
                ...offerData,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date()
            }

            if (existingOffer) {
                // Update existing
                await updateDoc(doc(db, 'offer_letters', applicationId), {
                    ...offerLetterData,
                    updatedAt: new Date()
                })
            } else {
                // Create new
                await addDoc(collection(db, 'offer_letters'), offerLetterData)
            }

            alert('Offer letter saved as draft!')
            setIsEditMode(false)
            await fetchData()
        } catch (error) {
            console.error('Error saving offer letter:', error)
            alert('Failed to save offer letter')
        } finally {
            setSaving(false)
        }
    }

    const handleSendEmail = async () => {
        if (!offerData.salary || !offerData.joiningDate) {
            alert('Please fill in all required fields (Salary and Joining Date)')
            return
        }

        if (!window.confirm(`Send offer letter to ${applicationData.personalDetails.fullName}?`)) {
            return
        }

        try {
            setSending(true)

            // Save/update offer letter first
            const offerLetterData = {
                applicationId,
                candidateName: applicationData.personalDetails.fullName,
                candidateEmail: applicationData.personalDetails.email,
                ...offerData,
                status: 'sent',
                createdAt: existingOffer?.createdAt || new Date(),
                updatedAt: new Date(),
                sentAt: new Date()
            }

            if (existingOffer) {
                await updateDoc(doc(db, 'offer_letters', applicationId), offerLetterData)
            } else {
                await addDoc(collection(db, 'offer_letters'), offerLetterData)
            }

            // Send email via Cloud Function
            const sendOfferEmail = httpsCallable(functions, 'sendOfferLetterEmail')
            await sendOfferEmail({
                email: applicationData.personalDetails.email,
                candidateName: applicationData.personalDetails.fullName,
                ...offerData
            })

            alert('Offer letter sent successfully!')
            navigate('/admin/resume-screening')
        } catch (error) {
            console.error('Error sending offer letter:', error)
            alert('Failed to send offer letter. Please try again.')
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="card text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading application data...</p>
                </div>
            </div>
        )
    }

    if (!applicationData) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="card text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application not found</h3>
                    <button onClick={() => navigate('/admin/resume-screening')} className="btn-primary mt-4">
                        Back to Resume Screening
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Offer Letter</h1>
                    <p className="text-gray-600">Generate and send offer letter to {applicationData.personalDetails.fullName}</p>
                </div>
                <button
                    onClick={() => navigate('/admin/resume-screening')}
                    className="btn-secondary"
                >
                    ← Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Form */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Offer Details</h2>
                        {!isEditMode && (
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                                ✏️ Edit
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Candidate Info (Read-only) */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Candidate</p>
                            <p className="font-semibold text-gray-900">{applicationData.personalDetails.fullName}</p>
                            <p className="text-sm text-gray-600">{applicationData.personalDetails.email}</p>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Position/Role <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="role"
                                value={offerData.role}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., Senior Software Engineer"
                                disabled={!isEditMode}
                                required
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="department"
                                value={offerData.department}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., Engineering"
                                disabled={!isEditMode}
                                required
                            />
                        </div>

                        {/* Salary */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Annual Salary (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="salary"
                                value={offerData.salary}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., 1200000"
                                disabled={!isEditMode}
                                required
                            />
                        </div>

                        {/* Joining Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Joining Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={offerData.joiningDate}
                                onChange={handleInputChange}
                                className="input-field"
                                disabled={!isEditMode}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Work Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={offerData.location}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="e.g., Mumbai, India"
                                disabled={!isEditMode}
                            />
                        </div>

                        {/* Additional Terms */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Terms
                            </label>
                            <textarea
                                name="additionalTerms"
                                value={offerData.additionalTerms}
                                onChange={handleInputChange}
                                className="input-field min-h-[100px]"
                                placeholder="Any additional terms or benefits..."
                                disabled={!isEditMode}
                            />
                        </div>

                        {/* Action Buttons */}
                        {isEditMode && (
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveDraft}
                                    className="btn-secondary flex-1"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : '💾 Save Draft'}
                                </button>
                                <button
                                    onClick={handleSendEmail}
                                    className="btn-primary flex-1"
                                    disabled={sending || !offerData.salary || !offerData.joiningDate}
                                >
                                    {sending ? 'Sending...' : '📧 Send Offer Letter'}
                                </button>
                            </div>
                        )}

                        {!isEditMode && existingOffer?.status === 'sent' && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    ✓ Offer letter sent on {new Date(existingOffer.sentAt.toDate()).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="card bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Preview</h2>

                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
                        {/* Letterhead */}
                        <div className="border-b-2 border-primary-600 pb-4 mb-6">
                            <h1 className="text-2xl font-bold text-primary-600">Hitachi</h1>
                            <p className="text-sm text-gray-600">Human Resources Department</p>
                        </div>

                        {/* Date */}
                        <p className="text-sm text-gray-600 mb-6">
                            Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        {/* Recipient */}
                        <div className="mb-6">
                            <p className="font-semibold text-gray-900">{applicationData.personalDetails.fullName}</p>
                            <p className="text-sm text-gray-600">{applicationData.personalDetails.email}</p>
                        </div>

                        {/* Subject */}
                        <p className="font-bold text-gray-900 mb-4">Subject: Offer of Employment</p>

                        {/* Body */}
                        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                            <p>Dear {applicationData.personalDetails.fullName},</p>

                            <p>
                                We are pleased to offer you the position of <strong>{offerData.role || '[Position]'}</strong> in
                                the <strong>{offerData.department || '[Department]'}</strong> department at Hitachi.
                            </p>

                            <p>The details of your employment are as follows:</p>

                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong>Position:</strong> {offerData.role || '[Position]'}</li>
                                <li><strong>Department:</strong> {offerData.department || '[Department]'}</li>
                                <li><strong>Annual Salary:</strong> ₹{offerData.salary ? parseInt(offerData.salary).toLocaleString() : '[Salary]'}</li>
                                <li><strong>Joining Date:</strong> {offerData.joiningDate ? new Date(offerData.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Date]'}</li>
                                {offerData.location && <li><strong>Work Location:</strong> {offerData.location}</li>}
                            </ul>

                            {offerData.additionalTerms && (
                                <>
                                    <p><strong>Additional Terms:</strong></p>
                                    <p className="whitespace-pre-wrap">{offerData.additionalTerms}</p>
                                </>
                            )}

                            <p>
                                This offer is contingent upon successful completion of background verification and reference checks.
                            </p>

                            <p>
                                We are excited about the prospect of you joining our team and look forward to your positive response.
                            </p>

                            <p>
                                Please confirm your acceptance by replying to this email.
                            </p>

                            <p className="mt-6">
                                Sincerely,<br />
                                <strong>Human Resources Team</strong><br />
                                Hitachi
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OfferLetter

function EducationEntry({ education, index, onChange, onRemove, canRemove }) {
    const degreeOptions = [
        { value: '', label: 'Select Degree Level' },
        { value: 'High School', label: 'High School' },
        { value: 'Diploma', label: 'Diploma' },
        { value: 'UG', label: 'UG - Bachelor\'s Degree' },
        { value: 'PG', label: 'PG - Master\'s Degree' },
        { value: 'PhD', label: 'PhD - Doctorate' }
    ]

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

    const handleChange = (field, value) => {
        onChange(index, { ...education, [field]: value })
    }

    return (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 relative">
            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove this education"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}

            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Education {index + 1}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Degree Level */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Degree Level <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={education.degreeLevel}
                        onChange={(e) => handleChange('degreeLevel', e.target.value)}
                        className="input-field"
                        required
                    >
                        {degreeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Institution */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={education.institution}
                        onChange={(e) => handleChange('institution', e.target.value)}
                        className="input-field"
                        placeholder="e.g., University of California"
                        required
                    />
                </div>

                {/* Field of Study */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Field of Study <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={education.fieldOfStudy}
                        onChange={(e) => handleChange('fieldOfStudy', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Computer Science"
                        required
                    />
                </div>

                {/* Year of Completion */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Year of Completion <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={education.yearOfCompletion}
                        onChange={(e) => handleChange('yearOfCompletion', e.target.value)}
                        className="input-field"
                        required
                    >
                        <option value="">Select Year</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Grade/Percentage */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Grade/Percentage <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={education.grade}
                        onChange={(e) => handleChange('grade', e.target.value)}
                        className="input-field"
                        placeholder="e.g., 3.8 GPA or 85%"
                        required
                    />
                </div>
            </div>
        </div>
    )
}

export default EducationEntry

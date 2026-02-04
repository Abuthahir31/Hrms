function WorkExperienceEntry({ experience, index, onChange, onRemove, canRemove }) {
    const handleChange = (field, value) => {
        onChange(index, { ...experience, [field]: value })
    }

    return (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 relative">
            {canRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove this work experience"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )}

            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Work Experience {index + 1}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name
                    </label>
                    <input
                        type="text"
                        value={experience.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Google Inc."
                    />
                </div>

                {/* Position */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Position
                    </label>
                    <input
                        type="text"
                        value={experience.position}
                        onChange={(e) => handleChange('position', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Software Engineer"
                    />
                </div>

                {/* Duration */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration
                    </label>
                    <input
                        type="text"
                        value={experience.duration}
                        onChange={(e) => handleChange('duration', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Jan 2020 - Present (3 years)"
                    />
                </div>

                {/* Job Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Job Description
                    </label>
                    <textarea
                        value={experience.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="input-field min-h-[100px]"
                        placeholder="Describe your responsibilities and achievements..."
                    />
                </div>
            </div>
        </div>
    )
}

export default WorkExperienceEntry

function UnderConstruction() {
    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center px-4">
                {/* Construction Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        {/* Animated Circle Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse opacity-20 blur-xl"></div>

                        {/* Icon Container */}
                        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-8 shadow-2xl">
                            <svg
                                className="w-24 h-24 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    Under Construction
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md mx-auto">
                    We're working hard to bring you this feature. Check back soon!
                </p>

                {/* Progress Indicator */}
                <div className="max-w-xs mx-auto mb-8">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Development in progress...</p>
                </div>

                {/* Decorative Elements */}
                <div className="flex justify-center gap-4 mt-8">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
    )
}

export default UnderConstruction

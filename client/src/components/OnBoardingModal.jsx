"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Trophy, Zap, Target } from "lucide-react"

const OnboardingModal = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      icon: <Trophy className="h-16 w-16 text-yellow-400" />,
      title: "Welcome to CodeClash!",
      description: "Ready to become a coding champion? Let's show you how our trophy system works.",
      details: "Compete with other developers, solve challenging problems, and climb the leaderboard!",
    },
    {
      icon: <Zap className="h-16 w-16 text-purple-400" />,
      title: "Earn Trophies by Solving Problems",
      description: "Practice coding problems to earn trophies and improve your skills.",
      details: [
        "🟢 Easy problems: 10-20 trophies",
        "🟡 Medium problems: 30-50 trophies",
        "🔴 Hard problems: 60-100 trophies",
        "🔥 Daily streak bonuses for consistent practice!",
      ],
    },
    {
      icon: <Target className="h-16 w-16 text-red-400" />,
      title: "Win Duels to Climb the Leaderboard",
      description: "Challenge other players in real-time coding duels.",
      details: [
        "🏆 Win duels to gain trophies from opponents",
        "⚡ Faster solutions earn more trophies",
        "🎯 Climb through trophy tiers: Beginner → Expert → Champion → Legend",
        "📊 Track your progress on the global leaderboard",
      ],
    },
  ]

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleFinish = () => {
    // Mark onboarding as completed
    localStorage.setItem("onboardingCompleted", "true")
    onClose()
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentSlideData = slides[currentSlide]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-gray-900 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-700">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-gray-800 rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center mb-6">{currentSlideData.icon}</div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4">{currentSlideData.title}</h3>

            {/* Description */}
            <p className="text-gray-300 mb-6 text-lg">{currentSlideData.description}</p>

            {/* Details */}
            <div className="bg-gray-800 rounded-lg p-4 mb-8 text-left">
              {Array.isArray(currentSlideData.details) ? (
                <ul className="space-y-2">
                  {currentSlideData.details.map((detail, index) => (
                    <li key={index} className="text-gray-300 text-sm">
                      {detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm text-center">{currentSlideData.details}</p>
              )}
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center space-x-2 mb-6">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index === currentSlide ? "bg-purple-500" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              <span className="text-sm text-gray-400">
                {currentSlide + 1} of {slides.length}
              </span>

              {currentSlide === slides.length - 1 ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-medium rounded-md transition-all duration-200"
                >
                  Get Started!
                  <Target className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={nextSlide}
                  className="flex items-center px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingModal

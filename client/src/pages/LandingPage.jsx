"use client"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Code, Users, Trophy, Clock, Star, ChevronRight, ChevronLeft, Github, Terminal, Award, BookOpen, Zap, Monitor } from "lucide-react"

const LandingPage = () => {
  const { isAuthenticated } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [codeProgress, setCodeProgress] = useState(0)

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Software Engineer at Google",
      image: "/api/placeholder/80/80",
      text: "CodeClash completely transformed how I practice for coding interviews. The competitive element makes learning algorithms actually fun!"
    },
    {
      name: "Sarah Johnson",
      role: "Full Stack Developer",
      image: "/api/placeholder/80/80",
      text: "I've improved my problem-solving speed by 40% after just one month of daily duels. The ranking system keeps me motivated to continue improving."
    },
    {
      name: "Michael Park",
      role: "CS Student at MIT",
      image: "/api/placeholder/80/80",
      text: "The real-time competitive aspect brings a whole new dimension to coding practice. It simulates the pressure of technical interviews perfectly."
    }
  ]

  const stats = [
    { value: "10,000+", label: "Active Users" },
    { value: "500+", label: "Algorithm Challenges" },
    { value: "25,000+", label: "Duels Completed" },
    { value: "98%", label: "User Satisfaction" }
  ]

  useEffect(() => {
    setIsVisible(true)
    
    // Code typing animation
    const codeInterval = setInterval(() => {
      setCodeProgress(prev => {
        if (prev >= 100) {
          return 0
        }
        return prev + 1
      })
    }, 150)
    
    // Testimonial carousel
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => 
        prev === testimonials.length - 1 ? 0 : prev + 1
      )
    }, 5000)
    
    return () => {
      clearInterval(codeInterval)
      clearInterval(testimonialInterval)
    }
  }, [testimonials.length])

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => 
      prev === testimonials.length - 1 ? 0 : prev + 1
    )
  }

  const prevTestimonial = () => {
    setCurrentTestimonial(prev => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      {/* Hero Section with Animation */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center">


        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div 
              className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
            >
              <div className="inline-block px-3 py-1 rounded-full bg-purple-800 text-purple-200 text-sm font-medium mb-2">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
                  Next-Gen Coding Platform
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                <span className="block">CodeClash</span>
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">Duel</span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-2xl">
                Challenge your coding skills in real-time duels. Solve algorithms faster than your opponent and climb
                the global leaderboard to prove your expertise.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-md font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/30 flex items-center"
                  >
                    Go to Dashboard
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-md font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/30 flex items-center"
                    >
                      Get Started
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-4 border border-white hover:bg-white hover:text-gray-900 rounded-md font-medium transition-all duration-300 flex items-center"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 overflow-hidden">
                      <img src={`/api/placeholder/80/80`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-300">
                  <span className="font-semibold text-white">1,200+</span> coders joined this week
                </div>
              </div>
            </div>

            <div 
              className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div className="w-full h-[450px] bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20"></div>
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                      Live Coding Duel
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-gray-700 rounded-md p-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-600 mr-2 flex items-center justify-center text-xs font-bold">J</div>
                        <span className="text-sm">John_Dev</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-900 rounded-full">1245 ELO</span>
                    </div>
                    <div className="bg-gray-700 rounded-md p-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-red-600 mr-2 flex items-center justify-center text-xs font-bold">S</div>
                        <span className="text-sm">CodeSage</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-900 rounded-full">1267 ELO</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-900 rounded-md p-4 font-mono text-sm overflow-hidden relative">
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800 rounded text-xs">Problem: Max Subarray Sum</div>
                    <div className="text-green-400 h-full overflow-hidden">
                      <div 
                        className="transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 5 ? 1 : 0 }}
                      >
                        <p>function findMaxSubarraySum(arr) {"{"}</p>
                      </div>
                      <div 
                        className="ml-4 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 15 ? 1 : 0 }}
                      >
                        <p>let maxSoFar = arr[0];</p>
                      </div>
                      <div 
                        className="ml-4 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 25 ? 1 : 0 }}
                      >
                        <p>let maxEndingHere = arr[0];</p>
                      </div>
                      <div 
                        className="ml-4 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 35 ? 1 : 0 }}
                      >
                        <p></p>
                      </div>
                      <div 
                        className="ml-4 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 45 ? 1 : 0 }}
                      >
                        <p>for (let i = 1; i {"<"} arr.length; i++) {"{"}</p>
                      </div>
                      <div 
                        className="ml-8 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 55 ? 1 : 0 }}
                      >
                        <p>maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);</p>
                      </div>
                      <div 
                        className="ml-8 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 65 ? 1 : 0 }}
                      >
                        <p>maxSoFar = Math.max(maxSoFar, maxEndingHere);</p>
                      </div>
                      <div 
                        className="ml-4 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 75 ? 1 : 0 }}
                      >
                        <p>{"}"}</p>
                      </div>
                      <div 
                        className="ml-4 transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 85 ? 1 : 0 }}
                      >
                        <p>return maxSoFar;</p>
                      </div>
                      <div 
                        className="transition-all duration-200 ease-in-out"
                        style={{ opacity: codeProgress > 95 ? 1 : 0 }}
                      >
                        <p>{"}"}</p>
                      </div>
                      
                      {/* Blinking cursor */}
                      <div className="absolute h-5 w-2 bg-white opacity-70 animate-blink" style={{ 
                        top: `${Math.min(18 + codeProgress * 0.2, 38)}%`, 
                        left: `${Math.min(4 + codeProgress * 0.7, 70)}%` 
                      }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg shadow-lg transform rotate-2 transition-transform hover:rotate-0 duration-300">
                <div className="text-xl font-bold flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Time Left: 12:45
                </div>
              </div>
              
              <div className="absolute -top-4 -left-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                <div className="text-sm font-bold flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  2/2 Players
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1600')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="p-6 rounded-lg bg-gray-700/50 backdrop-blur-sm border border-gray-700 transform transition-transform duration-300 hover:scale-105"
              >
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Animation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How CodeClash Works</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our platform combines competitive coding with effective learning to help you master technical interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "Match with Peers",
                description: "Get paired with another coder of similar skill level for a fair and challenging match-up.",
                color: "from-blue-600 to-blue-700"
              },
              {
                icon: <Code className="w-6 h-6" />,
                title: "Solve Problems",
                description: "Tackle algorithmic challenges in our real-time collaborative editor with syntax highlighting.",
                color: "from-purple-600 to-purple-700"
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Race Against Time",
                description: "Submit your solution faster than your opponent to win the duel and climb the rankings.",
                color: "from-indigo-600 to-indigo-700"
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: "Climb the Ranks",
                description: "Win duels to increase your rating and compete with the top programmers globally.",
                color: "from-pink-600 to-pink-700"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg transform transition-all duration-500 hover:-translate-y-2 border border-gray-700 group"
              >
                <div className="h-2 bg-gradient-to-r group-hover:scale-105 transition-transform duration-500 origin-left" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                  <div className={`h-full w-full bg-gradient-to-r ${feature.color}`}></div>
                </div>
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br ${feature.color} transform transition-transform duration-500 group-hover:rotate-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - NEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Join thousands of developers who are already improving their skills with CodeClash.
            </p>
          </div>

          <div className="relative">
            <div className="max-w-4xl mx-auto bg-gray-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r from-purple-800 to-purple-900 opacity-20 blur-3xl"></div>
              
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`transition-all duration-500 flex flex-col md:flex-row items-center text-center md:text-left gap-8 ${
                    currentTestimonial === index ? 'opacity-100 translate-x-0' : 'absolute opacity-0 translate-x-16'
                  }`}
                  style={{ display: currentTestimonial === index ? 'flex' : 'none' }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-500">
                      <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center md:justify-start mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-lg italic mb-4 text-gray-300">"{testimonial.text}"</blockquote>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentTestimonial === index ? 'bg-purple-500 w-6' : 'bg-gray-500'}`}
                    onClick={() => setCurrentTestimonial(index)}
                  ></button>
                ))}
              </div>
              
              <button 
                className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 md:translate-x-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500 transition-colors duration-300"
                onClick={prevTestimonial}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button 
                className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 md:translate-x-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500 transition-colors duration-300"
                onClick={nextTestimonial}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - NEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to excel in technical interviews and competitive programming.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Terminal className="w-6 h-6" />,
                title: "Smart Code Editor",
                description: "Feature-rich editor with syntax highlighting, auto-completion, and error detection for multiple languages."
              },
              {
                icon: <Github className="w-6 h-6" />,
                title: "Algorithm Library",
                description: "Access 500+ curated algorithm problems across various difficulty levels and categories."
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Global Leaderboard",
                description: "Compete with programmers worldwide and track your progress on our live leaderboard."
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Learning Resources",
                description: "Access solution explanations, tutorials, and best practices to improve your problem-solving approach."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Real-time Duels",
                description: "Engage in live coding competitions with time constraints to simulate interview pressure."
              },
              {
                icon: <Monitor className="w-6 h-6" />,
                title: "Performance Analytics",
                description: "Track your solving patterns, speed improvements, and skill growth over time."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with improved design */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800 relative overflow-hidden">
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to test your coding skills?</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join thousands of developers improving their algorithmic problem-solving abilities through competitive
            coding. Start your first duel today and see where you stand!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-all duration-300 shadow-xl shadow-purple-800/30 transform hover:scale-105 flex items-center"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Coding Now"}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
            
            <Link
              to="/features"
              className="px-8 py-4 border border-white text-white hover:bg-white/10 rounded-lg font-medium transition-all duration-300"
            >
              Explore Features
            </Link>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Languages Supported", value: "Python, JavaScript, Java, and more" },
              { label: "Skill Levels", value: "Beginner to Advanced" },
              { label: "New Problems", value: "Added Weekly" },
              { label: "Community Support", value: "24/7 Discord Access" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-gray-400 text-sm mb-1">{item.label}</div>
                <div className="font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}

export default LandingPage;
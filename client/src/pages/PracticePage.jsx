"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Code, Search, Filter, ArrowRight, Clock, CheckCircle, XCircle, Tag } from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const PracticePage = () => {
  const { currentUser } = useAuth()

  const [problems, setProblems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProblems: 0,
  })
  const [availableTags, setAvailableTags] = useState([])

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Build query parameters
        const queryParams = new URLSearchParams({
          page: pagination.currentPage,
          limit: 10,
          sortBy,
          order: sortOrder,
        })

        if (difficultyFilter !== "all") {
          queryParams.append("difficulty", difficultyFilter)
        }

        if (tagFilter !== "all") {
          queryParams.append("tags", tagFilter)
        }

        if (searchQuery) {
          queryParams.append("search", searchQuery)
        }

        const response = await api.get(`/practice/problems?${queryParams.toString()}`)
        console.log("res",response.data.problems);
        setProblems(response.data.problems)
        setPagination({
          currentPage: Number.parseInt(response.data.currentPage),
          totalPages: Number.parseInt(response.data.totalPages),
          totalProblems: Number.parseInt(response.data.totalProblems),
        })

        // Fetch available tags if not already loaded
        // if (availableTags.length === 0) {
        //   const tagsResponse = await api.get("/practice/tags")
        //   setAvailableTags(tagsResponse.data.tags)
        // }
      } catch (error) {
        console.error("Error fetching problems:", error)
        setError("Failed to load problems. Please try again.")
        toast.error("Failed to load problems. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProblems()
  }, [pagination.currentPage, difficultyFilter, tagFilter, sortBy, sortOrder, searchQuery, availableTags.length])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({
        ...prev,
        currentPage: newPage,
      }))
      // Scroll to top when changing page
      window.scrollTo(0, 0)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Reset to first page when searching
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new sort column and default to descending
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
    // Reset to first page
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }

  const resetFilters = () => {
    setSearchQuery("")
    setDifficultyFilter("all")
    setTagFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-500 bg-green-900 bg-opacity-20"
      case "Medium":
        return "text-yellow-500 bg-yellow-900 bg-opacity-20"
      case "Hard":
        return "text-red-500 bg-red-900 bg-opacity-20"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Code className="h-8 w-8 text-purple-400 mr-2" />
              Practice Problems
            </h1>
            <p className="text-gray-400 mt-2">Sharpen your coding skills with our collection of algorithmic problems</p>
          </div>

          <div className="mt-4 md:mt-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </form>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Tags</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-400 mb-1">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split("-")
                    setSortBy(newSortBy)
                    setSortOrder(newSortOrder)
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="solvedCount-desc">Most Solved</option>
                  <option value="solvedCount-asc">Least Solved</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>
              </div>

              <div className="w-full md:w-auto mt-auto">
                <button
                  onClick={resetFilters}
                  className="w-full md:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Problems</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : problems.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange("title")}
                    >
                      <div className="flex items-center">
                        Title
                        {sortBy === "title" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange("difficulty")}
                    >
                      <div className="flex items-center">
                        Difficulty
                        {sortBy === "difficulty" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Tags
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange("solvedCount")}
                    >
                      <div className="flex items-center">
                        Solved
                        {sortBy === "solvedCount" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {problems.map((problem) => (
                    <tr key={problem._id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {problem.isSolved ? (
                          <div className="flex gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Attempted</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Clock className="h-5 w-5 text-red-500" />
                            <span>Not Attempted</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{problem.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags &&
                            problem.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {problem.tags.length==0 && <span>N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{problem.solvedCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/practice/${problem._id}`}
                          className="text-purple-400 hover:text-purple-300 flex items-center"
                        >
                          Solve <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalProblems} problems)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 bg-gray-700 rounded-md text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 bg-gray-700 rounded-md text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No problems found matching your criteria.</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Stats Section */}
        {currentUser && (
          <div className="mt-12 bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-400">{problems.filter((p) => p.isSolved).length}</div>
                <div className="text-sm text-gray-400">Problems Solved</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500">
                  {problems.filter((p) => p.difficulty === "Easy" && p.isSolved).length}
                </div>
                <div className="text-sm text-gray-400">Easy Problems</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-500">
                  {problems.filter((p) => p.difficulty === "Medium" && p.isSolved).length}
                </div>
                <div className="text-sm text-gray-400">Medium Problems</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-red-500">
                  {problems.filter((p) => p.difficulty === "Hard" && p.isSolved).length}
                </div>
                <div className="text-sm text-gray-400">Hard Problems</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default PracticePage

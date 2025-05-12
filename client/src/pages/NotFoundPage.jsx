import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Home } from "lucide-react"

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <h1 className="text-9xl font-extrabold text-purple-500">404</h1>
          <h2 className="mt-4 text-3xl font-bold">Page Not Found</h2>
          <p className="mt-2 text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default NotFoundPage

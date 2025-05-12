import { Link } from "react-router-dom"
import { Github, Mail, Linkedin } from "lucide-react"

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <span className="text-xl font-bold text-white">
                CodeClash<span className="text-purple-400">&lt; / &gt;</span>
              </span>
            </div>
            <p className="mt-4 text-gray-400 max-w-md">
              A real-time, competitive DSA coding platform where users can match with another user for a live, 1-on-1
              coding challenge.
            </p>
            <div className="mt-6 flex space-x-6">
              <a href="https://github.com/vishnuvr16" className="text-gray-400 hover:text-white">
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" />
              </a>
              <a href="mailto:vishnuvardhanreddygajjala1@gmail.com" className="text-gray-400 hover:text-white">
                <span className="sr-only">Email</span>
                <Mail className="h-6 w-6" />
              </a>
              <a href="https://linkedin.com/in/vishnuvardhanreddy-gajjala" className="text-gray-400 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Platform</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/dashboard" className="text-base text-gray-400 hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-base text-gray-400 hover:text-white">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/practice" className="text-base text-gray-400 hover:text-white">
                  Practice Problems
                </Link>
              </li>
              {/* <li>
                <Link href="#" className="text-base text-gray-400 hover:text-white">
                  API Documentation
                </Link>
              </li> */}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="/" className="text-base text-gray-400 hover:text-white">
                  About
                </a>
              </li>
              {/* <li>
                <a href="#" className="text-base text-gray-400 hover:text-white">
                  Blog
                </a>
              </li> */}
              <li>
                <a href="#" className="text-base text-gray-400 hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-400 hover:text-white">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} CodeClash. Made by Vishnu
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

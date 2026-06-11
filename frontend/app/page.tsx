import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          AI Project Manager
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Transform your business requirements into full project plans, system designs, and GitHub issues — automatically.
        </p>
        <div className="flex gap-4 justify-center">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </SignedIn>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="font-semibold text-gray-900 mb-1">Project Roadmap</h3>
            <p className="text-sm text-gray-500">Automated milestone planning with tech stack recommendations</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-2">🏗️</div>
            <h3 className="font-semibold text-gray-900 mb-1">System Design</h3>
            <p className="text-sm text-gray-500">Architecture diagrams, database schemas, and API endpoints</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold text-gray-900 mb-1">GitHub Issues</h3>
            <p className="text-sm text-gray-500">Automatically creates sprint-organized tasks in your repo</p>
          </div>
        </div>
      </div>
    </div>
  )
}

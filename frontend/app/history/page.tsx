'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function History() {
  const { user } = useUser()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/projects/${user.id}`)
        .then(res => setProjects(res.data.projects))
        .finally(() => setLoading(false))
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-semibold text-gray-900">AI Project Manager</span>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          + New Project
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Project History</h1>
        <p className="text-gray-500 text-sm mb-8">Your previously generated project plans</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link href="/dashboard">
              <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                Create your first project
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p: any) => (
              <Link href={`/project/${p.session_id}`} key={p.session_id}>
                <div className="bg-white border rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {p.requirement}
                    </p>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

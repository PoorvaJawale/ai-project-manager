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

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Project History</h1>
      <div className="space-y-4">
        {projects.map((p: any) => (
          <Link href={`/project/${p.session_id}`} key={p.session_id}>
            <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start">
                <p className="font-medium line-clamp-2">{p.requirement}</p>
                <span className={`ml-4 text-xs px-2 py-1 rounded-full ${
                  p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{p.status}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">{new Date(p.created_at).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="text-gray-400">No projects yet. Create your first one!</p>
        )}
      </div>
    </div>
  )
}

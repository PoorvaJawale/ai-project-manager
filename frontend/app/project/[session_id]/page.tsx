'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

export default function ProjectPage() {
  const { session_id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session_id) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/project/${session_id}`)
        .then(res => setProject(res.data))
        .catch(() => setError('Project not found.'))
        .finally(() => setLoading(false))
    }
  }, [session_id])

  if (loading) return <div className="p-6 text-gray-500">Loading project...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!project) return null

  const safeParse = (val: any) => {
    if (!val) return null
    if (typeof val === 'string') { try { return JSON.parse(val) } catch { return val } }
    return val
  }
  const roadmap = safeParse(project.roadmap)
  const systemDesign = safeParse(project.system_design)
  const tasks = safeParse(project.tasks)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/history" className="text-sm text-blue-600 hover:underline">← Back to History</Link>
        <span className="text-xs text-gray-400">{new Date(project.created_at).toLocaleDateString()}</span>
      </div>

      <h1 className="text-2xl font-bold mb-1 text-gray-900">{project.requirement}</h1>
      <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 mb-8">{project.status}</span>

      <div className="space-y-6">
        <Section title="Project Roadmap" data={roadmap} />
        <Section title="System Design" data={systemDesign} />

        {tasks && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Tasks ({tasks.length})</h2>
            <div className="space-y-3">
              {tasks.map((task: any, i: number) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{task.priority}</span>
                  </div>
                  <p className="text-sm text-gray-500">{task.sprint} · {task.estimated_hours}h</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {task.labels?.map((label: string, j: number) => (
                      <span key={j} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, data }: { title: string; data: any }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto max-h-64">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

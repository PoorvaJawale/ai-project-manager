'use client'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const { user } = useUser()
  const [requirement, setRequirement] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [githubIssues, setGithubIssues] = useState<{ created: number; issues: any[] } | null>(null)

  const handleGenerate = async () => {
    if (!requirement && !file) return
    setLoading(true)
    setError('')
    setGithubIssues(null)

    try {
      let requirementText = requirement

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', user?.id || '')

        const uploadRes = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/upload-file`,
          formData
        )
        requirementText = uploadRes.data.full_text
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}/generate-project`,
        {
          requirement: requirementText,
          user_id: user?.id,
          github_repo: githubRepo
        }
      )

      setResult(res.data)

      if (githubRepo && res.data.tasks) {
        try {
          const issuesRes = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/create-github-issues`,
            {
              tasks: res.data.tasks,
              github_repo: githubRepo,
              session_id: res.data.session_id || crypto.randomUUID()
            }
          )
          setGithubIssues(issuesRes.data)
        } catch (issueErr: any) {
          setError(`Project generated but GitHub issues failed: ${issueErr.response?.data?.detail || issueErr.message}`)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">AI Project Manager</h1>
      <p className="text-gray-500 mb-8">Transform your idea into a full project plan</p>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <label className="block text-sm font-medium mb-2">Project Requirement</label>
        <textarea
          className="w-full border rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your project... e.g. Build a food delivery app with real-time tracking, payments, and restaurant management"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Or upload a requirements document</label>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">GitHub Repo (optional, for issue creation)</label>
          <input
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="username/repository-name"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || (!requirement && !file)}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating project plan...' : 'Generate Project Plan'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <ResultSection title="Project Roadmap" data={result.roadmap} />
          <ResultSection title="System Design" data={result.system_design} />
          <TasksSection tasks={result.tasks} />
          {githubIssues && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                GitHub Issues Created ({githubIssues.created})
              </h2>
              <div className="space-y-1">
                {githubIssues.issues.map((issue, i) => (
                  <a
                    key={i}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-green-700 hover:underline"
                  >
                    #{issue.number} {issue.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultSection({ title, data }: { title: string; data: any }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto max-h-64">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function TasksSection({ tasks }: { tasks: any[] }) {
  if (!tasks) return null
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">Generated Tasks ({tasks.length})</h2>
      <div className="space-y-3">
        {tasks.map((task, i) => (
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
            <div className="flex gap-1 mt-2">
              {task.labels?.map((label: string, j: number) => (
                <span key={j} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
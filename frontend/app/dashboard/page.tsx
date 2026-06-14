'use client'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useUser()
  const [requirement, setRequirement] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [githubIssues, setGithubIssues] = useState<{ created: number; issues: any[] } | null>(null)

  const handleGenerate = async () => {
    if (!requirement && !file && !githubRepo) return
    setLoading(true)
    setError('')
    setGithubIssues(null)
    setResult(null)

    try {
      let requirementText = requirement

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', user?.id || '')
        const uploadRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload-file`, formData)
        requirementText = uploadRes.data.full_text
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/generate`,
        { requirement: requirementText, user_id: user?.id || 'anonymous', github_repo: githubRepo },
        { timeout: 120000 }
      )

      setResult(res.data)

      if (githubRepo && res.data.tasks) {
        try {
          const issuesRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/create-github-issues`, {
            tasks: res.data.tasks,
            github_repo: githubRepo,
            session_id: res.data.session_id || crypto.randomUUID()
          })
          const issueData = issuesRes.data
          setGithubIssues(issueData)
          if (issueData.created === 0 && issueData.errors?.length > 0) {
            setError(`GitHub issues failed: ${issueData.errors[0]}`)
          }
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-semibold text-gray-900">AI Project Manager</span>
        </div>
        <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          View History →
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Transform your idea into a project plan</h1>
          <p className="text-gray-500">Describe your project or paste a GitHub repo to get a roadmap, system design, and tasks.</p>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Requirement</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3.5 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Build a food delivery app with real-time tracking, payments, and restaurant management"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Requirements Doc</label>
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-500">{fileName || 'PDF, DOCX, or TXT'}</span>
                  <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setFile(f)
                    setFileName(f?.name || '')
                  }} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GitHub Repo <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="w-full border border-gray-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="username/repository-name"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || (!requirement && !file && !githubRepo)}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating project plan...
              </>
            ) : 'Generate Project Plan'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <RoadmapSection roadmap={result.roadmap} />
            <SystemDesignSection design={result.system_design} />
            <TasksSection tasks={result.tasks} />
            {githubIssues && githubIssues.created > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-green-800">
                    {githubIssues.created} GitHub Issues Created
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {githubIssues.issues.map((issue, i) => (
                    <a key={i} href={issue.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:text-green-900 hover:underline truncate">
                      #{issue.number} {issue.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RoadmapSection({ roadmap }: { roadmap: any }) {
  if (!roadmap) return null
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Project Roadmap</h2>
        <div className="flex gap-3 text-sm text-gray-500">
          <span>{roadmap.timeline_weeks}w timeline</span>
          <span>·</span>
          <span>{roadmap.team_size} people</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(roadmap.tech_stack || {}).map(([category, techs]: any) =>
          techs.map((t: string) => (
            <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{t}</span>
          ))
        )}
      </div>

      <div className="space-y-3">
        {roadmap.milestones?.map((m: any, i: number) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</div>
              {i < roadmap.milestones.length - 1 && <div className="w-px h-full bg-gray-200 mt-1 min-h-[20px]" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 text-sm">{m.name}</span>
                <span className="text-xs text-gray-400">{m.duration_days}d</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {m.deliverables?.map((d: string, j: number) => (
                  <span key={j} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{d}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {roadmap.risk_factors?.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-medium text-gray-500 mb-2">RISK FACTORS</p>
          <div className="flex flex-wrap gap-2">
            {roadmap.risk_factors.map((r: string, i: number) => (
              <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">{r}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SystemDesignSection({ design }: { design: any }) {
  if (!design) return null
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">System Design</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {design.components?.map((c: any, i: number) => (
          <div key={i} className={`rounded-xl p-3.5 border ${
            c.type === 'frontend' ? 'bg-purple-50 border-purple-100' :
            c.type === 'backend' ? 'bg-blue-50 border-blue-100' :
            c.type === 'database' ? 'bg-green-50 border-green-100' :
            'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                c.type === 'frontend' ? 'text-purple-600' :
                c.type === 'backend' ? 'text-blue-600' :
                c.type === 'database' ? 'text-green-600' :
                'text-gray-500'
              }`}>{c.type}</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{c.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.technology}</p>
          </div>
        ))}
      </div>

      {design.api_endpoints?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-2">API ENDPOINTS</p>
          <div className="space-y-1.5">
            {design.api_endpoints.map((ep: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  ep.method === 'GET' ? 'bg-green-100 text-green-700' :
                  ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                  ep.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{ep.method}</span>
                <span className="font-mono text-gray-700 text-xs">{ep.path}</span>
                <span className="text-gray-400 text-xs truncate">{ep.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {design.database_schema?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">DATABASE SCHEMA</p>
          <div className="grid grid-cols-2 gap-3">
            {design.database_schema.map((table: any, i: number) => (
              <div key={i} className="border rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">{table.table_name}</p>
                <div className="space-y-1">
                  {table.columns?.map((col: any, j: number) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-mono">{col.name}</span>
                      <span className="text-gray-400">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TasksSection({ tasks }: { tasks: any[] }) {
  const [filter, setFilter] = useState('all')
  if (!tasks) return null

  const sprints = [...new Set(tasks.map(t => t.sprint))].sort()
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.sprint === filter)

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Tasks <span className="text-gray-400 font-normal text-base">({tasks.length})</span></h2>
        <div className="flex gap-1.5">
          <button onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
          {sprints.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((task, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-medium text-gray-800 text-sm leading-snug">{task.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>{task.priority}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{task.sprint} · {task.estimated_hours}h</p>
            <div className="flex flex-wrap gap-1">
              {task.labels?.map((label: string, j: number) => (
                <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
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

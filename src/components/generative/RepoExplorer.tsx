// components/generative/RepoExplorer.tsx
'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useTamboStreamStatus } from '@tambo-ai/react'
import { 
  Star, 
  GitFork, 
  Code, 
  ExternalLink, 
  Bookmark, 
  Eye,
  GitBranch,
  Calendar,
  FileText,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react'
import { QuickActionDialog } from '@/components/dialog/QuickActionDialog'

// Zod Schema
export const RepoExplorerPropsSchema = z.object({
  searchRequest: z.object({
    query: z.string().describe('Search query for repositories'),
    language: z.string().optional().describe('Programming language filter'),
    stars: z.number().optional().describe('Minimum stars filter'),
    sort: z.enum(['stars', 'forks', 'updated']).optional().describe('Sort order'),
  }).describe('GitHub repository search parameters'),
})

type RepoExplorerProps = z.infer<typeof RepoExplorerPropsSchema>

interface GitHubRepo {
  id: string
  name: string
  fullName: string
  description: string
  url: string
  stars: number
  forks: number
  language: string
  updatedAt: string
  owner: string
  watchers?: number
  openIssues?: number
  topics?: string[]
  license?: string
  size?: number
}

interface QuickActionState {
  isOpen: boolean
  action: 'bookmark' | 'schedule' | 'note' | null
  item: any
}

// Language color mapping (GitHub colors)
const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  React: '#61dafb',
}

export function RepoExplorer({ searchRequest }: RepoExplorerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [quickAction, setQuickAction] = useState<QuickActionState>({
    isOpen: false,
    action: null,
    item: null,
  })

  const { streamStatus } = useTamboStreamStatus()
  const isStreaming = !streamStatus.isSuccess && !streamStatus.isError

  useEffect(() => {
    if (!searchRequest?.query || isStreaming) return

    const fetchRepos = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/search/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchRequest),
        })

        if (!response.ok) {
          throw new Error('GitHub search failed')
        }

        const data = await response.json()
        setRepos(data.repos ?? [])
        console.log('✅ Loaded', data.repos?.length || 0, 'repositories')
      } catch (err: any) {
        setError(err.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [searchRequest?.query, isStreaming])

  const handleQuickAction = (action: 'bookmark' | 'schedule' | 'note', repo: GitHubRepo) => {
    setQuickAction({
      isOpen: true,
      action,
      item: {
        title: repo.fullName,
        url: repo.url,
        snippet: repo.description,
        type: 'repo' as const,
      },
    })
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  /* ---------------- streaming ---------------- */
  if (isStreaming) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-600 font-medium">Searching GitHub...</p>
          <p className="text-xs text-gray-500 mt-1">Finding the best repositories</p>
        </div>
      </div>
    )
  }

  /* ---------------- loading ---------------- */
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-linear-to-r from-white via-gray-50 to-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="flex gap-4 mt-4">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* ---------------- error ---------------- */
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <p className="text-red-700 font-medium">GitHub Search Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  /* ---------------- empty ---------------- */
  if (repos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Code size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-700 font-medium text-lg">No repositories found</p>
        <p className="text-gray-500 text-sm mt-1">Try a different search query for "{searchRequest.query}"</p>
      </div>
    )
  }

  /* ---------------- results ---------------- */
  const topRepo = repos[0]
  const isTopRepoTrending = topRepo && topRepo.stars > 1000

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Code size={20} className="text-gray-900" />
              GitHub Repositories
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Found <span className="font-semibold text-gray-900">{repos.length}</span> repositories for 
              <span className="font-semibold text-gray-900"> "{searchRequest.query}"</span>
              {searchRequest.language && (
                <span className="ml-1">in <span className="font-semibold text-gray-900">{searchRequest.language}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Repository Cards */}
        {repos.map((repo, index) => {
          const isHovered = hoveredId === repo.id
          const isTopRepo = index === 0
          const languageColor = languageColors[repo.language] || '#858585'
          const isTrending = repo.stars > 5000

          return (
            <div
              key={repo.id}
              onMouseEnter={() => setHoveredId(repo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                group relative bg-white rounded-xl border-2 transition-all duration-200
                ${isHovered 
                  ? 'border-gray-900 shadow-xl shadow-gray-200 -translate-y-1' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isTopRepo && isTopRepoTrending ? 'bg-linear-to-br from-yellow-50/50 to-white' : ''}
              `}
            >
              {/* Trending Badge */}
              {isTrending && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-linear-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <TrendingUp size={12} />
                    Trending
                  </div>
                </div>
              )}

              {/* Top Repo Badge */}
              {isTopRepo && (
                <div className="absolute -top-2 -left-2 z-10">
                  <div className="bg-linear-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Award size={12} />
                    Top Match
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* GitHub Avatar Placeholder */}
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {repo.owner.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Repo Info */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link inline-flex items-center gap-2 mb-1"
                      >
                        <h4 className="font-bold text-lg text-gray-900 group-hover/link:text-blue-600 transition-colors truncate">
                          {repo.fullName}
                        </h4>
                        <ExternalLink
                          size={16}
                          className="shrink-0 text-gray-400 opacity-0 group-hover/link:opacity-100 transition-opacity"
                        />
                      </a>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span>by {repo.owner}</span>
                        {repo.license && (
                          <>
                            <span>•</span>
                            <span>{repo.license}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {repo.description && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                {/* Topics */}
                {repo.topics && repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {repo.topics.slice(0, 5).map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {repo.topics.length > 5 && (
                      <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        +{repo.topics.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-4 pb-4 border-b border-gray-200">
                  {/* Language */}
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: languageColor }}
                      />
                      <span className="font-medium">{repo.language}</span>
                    </div>
                  )}

                  {/* Stars */}
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{formatNumber(repo.stars)}</span>
                  </div>

                  {/* Forks */}
                  <div className="flex items-center gap-1.5">
                    <GitFork size={14} className="text-blue-500" />
                    <span className="font-semibold">{formatNumber(repo.forks)}</span>
                  </div>

                  {/* Watchers */}
                  {repo.watchers !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Eye size={14} className="text-gray-500" />
                      <span>{formatNumber(repo.watchers)}</span>
                    </div>
                  )}

                  {/* Issues */}
                  {repo.openIssues !== undefined && repo.openIssues > 0 && (
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={14} className="text-green-500" />
                      <span>{formatNumber(repo.openIssues)} issues</span>
                    </div>
                  )}

                  {/* Updated */}
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock size={14} />
                    <span className="text-xs">Updated {formatDate(repo.updatedAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickAction('bookmark', repo)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Bookmark size={13} />
                    Bookmark
                  </button>
                  <button
                    onClick={() => handleQuickAction('schedule', repo)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Calendar size={13} />
                    Schedule
                  </button>
                  <button
                    onClick={() => handleQuickAction('note', repo)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-green-600 bg-gray-100 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileText size={13} />
                    Save Note
                  </button>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-900 hover:text-gray-700 bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Code size={13} />
                    View Code
                  </a>
                  <a
                    href={`${repo.url}/fork`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <GitFork size={13} />
                    Fork
                  </a>
                </div>
              </div>

              {/* Hover gradient border effect */}
              <div className={`
                absolute inset-0 rounded-xl bg-linear-to-r from-gray-700 via-gray-900 to-black opacity-0 
                ${isHovered ? 'opacity-5' : ''}
                transition-opacity duration-300 pointer-events-none
              `} />
            </div>
          )
        })}
      </div>

      {/* Quick Action Dialog */}
      {quickAction.isOpen && quickAction.action && (
        <QuickActionDialog
          isOpen={quickAction.isOpen}
          onClose={() => setQuickAction({ isOpen: false, action: null, item: null })}
          action={quickAction.action}
          item={quickAction.item}
        />
      )}
    </>
  )
}

export const repoExplorerComponent = {
  name: 'RepoExplorer',
  description:
    'Displays GitHub repositories with comprehensive metadata including stars, forks, language, topics, and activity. Features quick actions for bookmarking, scheduling, and note-taking.',
  component: RepoExplorer,
  propsSchema: RepoExplorerPropsSchema,
}
// components/generative/GitHubArchitectureDiagram.tsx
'use client'

import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useTamboStreamStatus } from '@tambo-ai/react'
import {
  Code,
  Server,
  Database,
  Layers,
  GitBranch,
  Zap,
  FileText,
  Loader,
  ExternalLink,
} from 'lucide-react'

// Zod Schema
export const GitHubArchitectureDiagramPropsSchema = z.object({
  repoOwner: z.string().describe('Repository owner username'),
  repoName: z.string().describe('Repository name'),
  diagramType: z.enum(['architecture', 'file-tree', 'dependencies']).optional().describe('Type of diagram'),
})

type GitHubArchitectureDiagramProps = z.infer<typeof GitHubArchitectureDiagramPropsSchema>

interface ArchNode {
  id: string
  type: 'frontend' | 'backend' | 'database' | 'api' | 'service' | 'component' | 'file'
  label: string
  description?: string
  language?: string
  path?: string
  connections: string[] // IDs of connected nodes
}

interface RepoStructure {
  name: string
  fullName: string
  description: string
  language: string
  url: string
  nodes: ArchNode[]
}

const nodeIcons: Record<ArchNode['type'], any> = {
  frontend: Code,
  backend: Server,
  database: Database,
  api: Zap,
  service: Layers,
  component: FileText,
  file: FileText,
}

const nodeColors: Record<ArchNode['type'], { bg: string; border: string; text: string }> = {
  frontend: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700' },
  backend: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
  database: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
  api: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700' },
  service: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
  component: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700' },
  file: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700' },
}

export function GitHubArchitectureDiagram({
  repoOwner,
  repoName,
  diagramType = 'architecture',
}: GitHubArchitectureDiagramProps) {
  const [structure, setStructure] = useState<RepoStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { streamStatus } = useTamboStreamStatus()
  const isStreaming = !streamStatus.isSuccess && !streamStatus.isError

  useEffect(() => {
    if (isStreaming) return

    const fetchRepoStructure = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/github/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: repoOwner,
            repo: repoName,
            analysisType: diagramType,
          }),
        })

        if (!response.ok) throw new Error('Failed to analyze repository')

        const data = await response.json()
        setStructure(data)
      } catch (err: any) {
        setError(err.message || 'Analysis failed')
        // Fallback to mock data for demo
        setStructure(generateMockStructure(repoOwner, repoName))
      } finally {
        setLoading(false)
      }
    }

    fetchRepoStructure()
  }, [repoOwner, repoName, diagramType, isStreaming])

  // Generate mock structure for demo
  const generateMockStructure = (owner: string, name: string): RepoStructure => {
    return {
      name,
      fullName: `${owner}/${name}`,
      description: `Architecture diagram for ${owner}/${name}`,
      language: 'TypeScript',
      url: `https://github.com/${owner}/${name}`,
      nodes: [
        {
          id: 'frontend',
          type: 'frontend',
          label: 'Frontend (React)',
          description: 'User interface components',
          language: 'TypeScript',
          path: '/src/components',
          connections: ['api'],
        },
        {
          id: 'api',
          type: 'api',
          label: 'REST API',
          description: 'API endpoints and routing',
          language: 'TypeScript',
          path: '/src/api',
          connections: ['backend', 'database'],
        },
        {
          id: 'backend',
          type: 'backend',
          label: 'Backend Services',
          description: 'Business logic and services',
          language: 'TypeScript',
          path: '/src/services',
          connections: ['database'],
        },
        {
          id: 'database',
          type: 'database',
          label: 'PostgreSQL',
          description: 'Data persistence layer',
          language: 'SQL',
          path: '/prisma',
          connections: [],
        },
      ],
    }
  }

  /* ---------------- Streaming State ---------------- */
  if (isStreaming) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Analyzing repository...</p>
        </div>
      </div>
    )
  }

  /* ---------------- Loading State ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Fetching repository structure...</p>
          <p className="text-gray-500 text-sm mt-1">{repoOwner}/{repoName}</p>
        </div>
      </div>
    )
  }

  /* ---------------- Error State ---------------- */
  if (error || !structure) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <p className="text-red-700 font-medium">Failed to analyze repository</p>
          <p className="text-red-600 text-sm mt-1">{error || 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  /* ---------------- Diagram Display ---------------- */
  return (
    <div className="h-full flex flex-col p-8 bg-linear-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GitBranch size={24} />
              {structure.fullName}
            </h2>
            <p className="text-gray-600 mt-1">{structure.description}</p>
          </div>
          <a
            href={structure.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ExternalLink size={16} />
            View on GitHub
          </a>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-4xl">
            {/* Nodes */}
            <div className="space-y-8">
              {structure.nodes.map((node, index) => {
                const Icon = nodeIcons[node.type]
                const colors = nodeColors[node.type]

                return (
                  <div
                    key={node.id}
                    className={`
                      relative
                      ${index % 2 === 0 ? 'ml-0' : 'ml-auto'}
                      ${index % 2 === 0 ? 'mr-auto' : 'mr-0'}
                      w-96
                    `}
                  >
                    <div
                      className={`
                        ${colors.bg} ${colors.border} border-2 rounded-xl p-6
                        shadow-lg hover:shadow-xl transition-all
                        transform hover:-translate-y-1
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${colors.border} border-2 rounded-lg p-2 ${colors.bg}`}>
                          <Icon size={24} className={colors.text} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{node.label}</h3>
                          {node.description && (
                            <p className="text-sm text-gray-600 mt-1">{node.description}</p>
                          )}
                          {node.language && (
                            <div className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              {node.language}
                            </div>
                          )}
                          {node.path && (
                            <div className="text-xs text-gray-500 mt-2 font-mono">{node.path}</div>
                          )}
                        </div>
                      </div>

                      {/* Connection indicators */}
                      {node.connections.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Connects to:</p>
                          <div className="flex flex-wrap gap-2">
                            {node.connections.map((connId) => {
                              const connNode = structure.nodes.find((n) => n.id === connId)
                              return connNode ? (
                                <span
                                  key={connId}
                                  className="text-xs px-2 py-1 bg-white border border-gray-300 rounded"
                                >
                                  {connNode.label}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connection arrows */}
                    {node.connections.length > 0 && index < structure.nodes.length - 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 text-gray-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Tip:</span> Ask Claude to modify this diagram: "Add authentication layer" or "Show database relationships"
        </p>
      </div>
    </div>
  )
}

export const gitHubArchitectureDiagramComponent = {
  name: 'GitHubArchitectureDiagram',
  description:
    'Visualizes GitHub repository architecture with interactive node-based diagrams showing frontend, backend, database, API, and service layers with their connections.',
  component: GitHubArchitectureDiagram,
  propsSchema: GitHubArchitectureDiagramPropsSchema,
}
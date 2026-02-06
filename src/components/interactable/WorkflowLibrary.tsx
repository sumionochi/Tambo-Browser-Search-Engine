// components/interactable/WorkflowLibrary.tsx
'use client'

import { withInteractable, useTamboComponentState } from '@tambo-ai/react'
import { z } from 'zod'
import {
  Zap,
  Trash2,
  RefreshCw,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader,
  FileText,
  BarChart3,
  Search,
  GitBranch,
  Image,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { ConfirmDialog } from '@/components/dialog/ConfirmDialog'
import { EditWithTamboButton } from '@/components/tambo/edit-with-tambo-button'

// ─── Zod Schema ───
export const WorkflowLibraryPropsSchema = z.object({
  workflows: z.array(
    z.object({
      id: z.string(),
      title: z.string().describe('Workflow title'),
      description: z.string().optional().describe('Brief description'),
      query: z.string().describe('Original research query'),
      status: z.string().describe('pending | running | completed | failed'),
      currentStep: z.number().describe('Current step index'),
      totalSteps: z.number().describe('Total number of steps'),
      sources: z.array(z.string()).describe('Search sources used'),
      outputFormat: z.string().describe('Report output format'),
      errorMessage: z.string().optional().nullable(),
      createdAt: z.string().describe('ISO datetime'),
      completedAt: z.string().optional().nullable(),
      report: z
        .object({
          id: z.string(),
          title: z.string(),
        })
        .optional()
        .nullable(),
    })
  ),
})

type WorkflowLibraryProps = z.infer<typeof WorkflowLibraryPropsSchema>

// ─── Workflow Templates ───
const workflowTemplates = [
  {
    id: 'tech-comparison',
    name: 'Tech Comparison',
    description: 'Compare technologies by GitHub stats, features, and community activity',
    icon: GitBranch,
    color: 'blue',
    prompt: 'Compare the top 5 {topic} by GitHub stars, community activity, and features. Create a comparison report.',
    defaultSources: ['google', 'github'],
    defaultFormat: 'comparison',
  },
  {
    id: 'market-research',
    name: 'Market Research',
    description: 'Research products, competitors, and market trends',
    icon: Search,
    color: 'purple',
    prompt: 'Research {topic}, find competitors, analyze reviews, and create a market analysis report.',
    defaultSources: ['google'],
    defaultFormat: 'analysis',
  },
  {
    id: 'image-research',
    name: 'Visual Research',
    description: 'Find and organize images with analysis',
    icon: Image,
    color: 'pink',
    prompt: 'Find high-quality images of {topic}, categorize them, and create a visual research summary.',
    defaultSources: ['google', 'pexels'],
    defaultFormat: 'summary',
  },
]

// Status config
const statusConfig: Record<
  string,
  { icon: any; color: string; bgColor: string; label: string }
> = {
  pending: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Queued' },
  running: { icon: Loader, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Running' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Failed' },
}

const templateColors: Record<string, { bg: string; border: string; iconBg: string }> = {
  blue: { bg: 'hover:bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100 text-blue-600' },
  purple: { bg: 'hover:bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100 text-purple-600' },
  pink: { bg: 'hover:bg-pink-50', border: 'border-pink-200', iconBg: 'bg-pink-100 text-pink-600' },
}

function WorkflowLibrary({ workflows: initialWorkflows }: WorkflowLibraryProps) {
  const [workflows, setWorkflows] = useTamboComponentState(
    'workflows',
    initialWorkflows || [],
    initialWorkflows || []
  )

  const [loading, setLoading] = useState(false)
  const hasLoadedRef = useRef(false)
  const isLoadingRef = useRef(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    workflowId: string
    workflowTitle: string
  } | null>(null)

  // Load workflows on mount
  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current) {
      loadWorkflows()
    }
  }, [])

  const loadWorkflows = async () => {
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      setLoading(true)

      const response = await fetch('/api/workflows')

      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
        hasLoadedRef.current = true
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  const handleRefresh = () => {
    hasLoadedRef.current = false
    loadWorkflows()
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWorkflows(safeWorkflows.filter((w) => w.id !== workflowId))
      }
    } catch (error) {
      console.error('Delete workflow error:', error)
    }
  }

  const handleCancelWorkflow = async (workflowId: string) => {
    try {
      await fetch(`/api/workflows/${workflowId}/cancel`, { method: 'POST' })
      handleRefresh()
    } catch (error) {
      console.error('Cancel workflow error:', error)
    }
  }

  const handleRetryWorkflow = async (workflowId: string) => {
    try {
      await fetch(`/api/workflows/${workflowId}/retry`, { method: 'POST' })
      handleRefresh()
    } catch (error) {
      console.error('Retry workflow error:', error)
    }
  }

  const safeWorkflows = workflows ?? []
  const activeWorkflows = safeWorkflows.filter(
    (w) => w.status === 'running' || w.status === 'pending'
  )
  const completedWorkflows = safeWorkflows.filter((w) => w.status === 'completed')
  const failedWorkflows = safeWorkflows.filter((w) => w.status === 'failed')

  // ─── Loading ───
  if (loading && safeWorkflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      </div>
    )
  }

  // ─── Main ───
  return (
    <>
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Research Workflows</h2>
            <p className="text-sm text-gray-500 mt-1">
              Automate multi-step research with AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EditWithTamboButton
              tooltip="Manage workflows with AI"
              description="Start new workflows, check status, or manage existing ones using natural language"
            />
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh workflows"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Active Workflows ── */}
        {activeWorkflows.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Loader size={14} className="animate-spin text-blue-600" />
              Active Workflows ({activeWorkflows.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWorkflows.map((workflow) => {
                const progress =
                  workflow.totalSteps > 0
                    ? Math.round((workflow.currentStep / workflow.totalSteps) * 100)
                    : 0
                return (
                  <div
                    key={workflow.id}
                    className="bg-white rounded-lg border-2 border-blue-200 p-5 relative overflow-hidden"
                  >
                    {/* Progress background */}
                    <div
                      className="absolute inset-0 bg-blue-50 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Zap size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {workflow.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Step {workflow.currentStep + 1} of {workflow.totalSteps}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelWorkflow(workflow.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Workflow Templates ── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            Quick Start Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflowTemplates.map((template) => {
              const Icon = template.icon
              const colors = templateColors[template.color] || templateColors.blue
              return (
                <div
                  key={template.id}
                  className={`bg-white rounded-lg border-2 ${colors.border} p-5 ${colors.bg} transition-all cursor-pointer group`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center shrink-0`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        {template.defaultSources.map((source) => (
                          <span
                            key={source}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize"
                          >
                            {source}
                          </span>
                        ))}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {template.defaultFormat}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-gray-400 group-hover:text-gray-600 transition-colors mt-1"
                    />
                  </div>

                  {/* Hint text */}
                  <p className="text-xs text-gray-400 mt-3 italic">
                    Try: &ldquo;{template.prompt.replace('{topic}', 'React frameworks')}&rdquo;
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Completed Workflows ── */}
        {completedWorkflows.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-600" />
              Completed ({completedWorkflows.length})
            </h3>
            <div className="space-y-3">
              {completedWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} className="text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {workflow.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {workflow.totalSteps} steps
                          </span>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-xs text-gray-500">
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                          {workflow.report && (
                            <>
                              <span className="text-gray-300">&middot;</span>
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <FileText size={10} />
                                Report ready
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {workflow.sources.map((source) => (
                          <span
                            key={source}
                            className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            workflowId: workflow.id,
                            workflowTitle: workflow.title,
                          })
                        }
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete workflow"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Failed Workflows ── */}
        {failedWorkflows.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <XCircle size={14} className="text-red-500" />
              Failed ({failedWorkflows.length})
            </h3>
            <div className="space-y-3">
              {failedWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white rounded-lg border border-red-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <XCircle size={16} className="text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {workflow.title}
                        </h4>
                        <p className="text-xs text-red-600 mt-0.5 truncate">
                          {workflow.errorMessage || 'Execution failed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRetryWorkflow(workflow.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-blue-50 rounded-lg"
                      >
                        <RotateCcw size={12} />
                        Retry
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            workflowId: workflow.id,
                            workflowTitle: workflow.title,
                          })
                        }
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete workflow"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {safeWorkflows.length === 0 && !loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <Zap size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No Workflows Yet</p>
              <p className="text-sm mt-2 max-w-md">
                Start a research workflow by asking AI to research, compare, or analyze topics.
                Try: &ldquo;Compare the top 5 JavaScript frameworks&rdquo;
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">⚡ Tip:</span> Ask AI to start a workflow:
            &ldquo;Research top 5 AI coding tools and create a comparison report&rdquo;
          </p>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => handleDeleteWorkflow(confirmDialog.workflowId)}
          title="Delete Workflow"
          message={`Are you sure you want to delete "${confirmDialog.workflowTitle}"? This will remove all execution data and any linked reports. This action cannot be undone.`}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  )
}

export const InteractableWorkflowLibrary = withInteractable(WorkflowLibrary, {
  componentName: 'WorkflowLibrary',
  description:
    'Manages AI research workflows. Shows active/completed/failed workflows, provides quick-start templates, and allows cancellation/retry/deletion. AI can start new workflows or check status.',
  propsSchema: WorkflowLibraryPropsSchema,
})
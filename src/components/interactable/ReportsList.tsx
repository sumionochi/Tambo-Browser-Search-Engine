// components/interactable/ReportsList.tsx
'use client'

import { withInteractable, useTamboComponentState } from '@tambo-ai/react'
import { z } from 'zod'
import {
  FileText,
  Trash2,
  RefreshCw,
  Clock,
  BarChart3,
  Copy,
  CheckCircle2,
  Zap,
  BookMarked,
  Table2,
  Type,
  List,
  ArrowRight,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { ConfirmDialog } from '@/components/dialog/ConfirmDialog'
import { EditWithTamboButton } from '@/components/tambo/edit-with-tambo-button'

// ─── Zod Schema ───
export const ReportsListPropsSchema = z.object({
  reports: z.array(
    z.object({
      id: z.string(),
      title: z.string().describe('Report title'),
      summary: z.string().describe('Executive summary'),
      format: z.string().describe('comparison | analysis | timeline | summary'),
      sectionCount: z.number().describe('Number of sections'),
      createdAt: z.string().describe('ISO datetime'),
      workflowId: z.string().optional().nullable(),
      sourceCollectionId: z.string().optional().nullable(),
    })
  ),
})

type ReportsListProps = z.infer<typeof ReportsListPropsSchema>

// Format badge config
const formatConfig: Record<
  string,
  { icon: any; color: string; bg: string; label: string }
> = {
  comparison: {
    icon: Table2,
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    label: 'Comparison',
  },
  analysis: {
    icon: BarChart3,
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    label: 'Analysis',
  },
  timeline: {
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    label: 'Timeline',
  },
  summary: {
    icon: Type,
    color: 'text-green-700',
    bg: 'bg-green-100',
    label: 'Summary',
  },
}

function ReportsList({ reports: initialReports }: ReportsListProps) {
  const [reports, setReports] = useTamboComponentState(
    'reports',
    initialReports || [],
    initialReports || []
  )

  const [loading, setLoading] = useState(false)
  const hasLoadedRef = useRef(false)
  const isLoadingRef = useRef(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    reportId: string
    reportTitle: string
  } | null>(null)

  // Load reports on mount
  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current) {
      loadReports()
    }
  }, [])

  const loadReports = async () => {
    if (isLoadingRef.current) return

    try {
      isLoadingRef.current = true
      setLoading(true)

      const response = await fetch('/api/reports')

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        hasLoadedRef.current = true
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  const handleRefresh = () => {
    hasLoadedRef.current = false
    loadReports()
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReports(safeReports.filter((r) => r.id !== reportId))
      }
    } catch (error) {
      console.error('Delete report error:', error)
    }
  }

  const handleCopySummary = async (report: any) => {
    await navigator.clipboard.writeText(`${report.title}\n\n${report.summary}`)
    setCopiedId(report.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const safeReports = reports ?? []

  // Group by format
  const groupedReports = safeReports.reduce(
    (acc, report) => {
      const format = report.format || 'summary'
      if (!acc[format]) acc[format] = []
      acc[format].push(report)
      return acc
    },
    {} as Record<string, typeof safeReports>
  )

  // ─── Loading ───
  if (loading && safeReports.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading reports...</p>
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
            <h2 className="text-2xl font-bold text-gray-900">Research Reports</h2>
            <p className="text-sm text-gray-500 mt-1">
              AI-generated reports from workflows and collections
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EditWithTamboButton
              tooltip="Manage reports with AI"
              description="Generate new reports from collections, view existing reports, or delete old ones"
            />
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh reports"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {safeReports.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(formatConfig).map(([format, config]) => {
              const count = groupedReports[format]?.length || 0
              const Icon = config.icon
              return (
                <div
                  key={format}
                  className={`p-3 rounded-lg border border-gray-200 ${
                    count > 0 ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}
                    >
                      <Icon size={16} className={config.color} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">{config.label}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Report Cards ── */}
        {safeReports.length > 0 && (
          <div className="space-y-4">
            {safeReports.map((report) => {
              const format = formatConfig[report.format] || formatConfig.summary
              const FormatIcon = format.icon

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 ${format.bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <FormatIcon size={20} className={format.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {report.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${format.bg} ${format.color} shrink-0`}
                          >
                            {format.label}
                          </span>
                        </div>

                        {/* Summary preview */}
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {report.summary}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <List size={10} />
                            {report.sectionCount} sections
                          </span>
                          {report.workflowId && (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <Zap size={10} />
                              From workflow
                            </span>
                          )}
                          {report.sourceCollectionId && (
                            <span className="text-xs text-purple-600 flex items-center gap-1">
                              <BookMarked size={10} />
                              From collection
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopySummary(report)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Copy summary"
                      >
                        {copiedId === report.id ? (
                          <CheckCircle2 size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            reportId: report.id,
                            reportTitle: report.title,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete report"
                      >
                        <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Empty State ── */}
        {safeReports.length === 0 && !loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No Reports Yet</p>
              <p className="text-sm mt-2 max-w-md">
                Reports are automatically generated when workflows complete. You can
                also generate reports from your collections.
              </p>
              <p className="text-sm mt-3">
                Try: &ldquo;Create a comparison report from my collection&rdquo;
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-900">
            <span className="font-semibold">📄 Tip:</span> Generate reports from
            collections: &ldquo;Summarize my AI Tools collection as a comparison report&rdquo;
          </p>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => handleDeleteReport(confirmDialog.reportId)}
          title="Delete Report"
          message={`Are you sure you want to delete "${confirmDialog.reportTitle}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  )
}

export const InteractableReportsList = withInteractable(ReportsList, {
  componentName: 'ReportsList',
  description:
    'Displays and manages AI-generated research reports. Shows report summaries, formats, and metadata. AI can generate new reports from collections or delete existing ones.',
  propsSchema: ReportsListPropsSchema,
})
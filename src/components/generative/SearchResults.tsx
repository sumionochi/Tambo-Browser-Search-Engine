// components/generative/SearchResults.tsx
'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useTamboStreamStatus } from '@tambo-ai/react'
import { ExternalLink, Bookmark, Calendar, FileText, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { QuickActionDialog } from '@/components/dialog/QuickActionDialog'

// Zod Schema
export const SearchResultsPropsSchema = z.object({
  searchRequest: z.object({
    query: z.string().describe("Search query text"),
    filters: z.object({
      num: z.number().optional().describe("Number of results"),
      freshness: z.enum(['day', 'week', 'month']).optional().describe("Freshness filter"),
    }).optional(),
  }).describe("Search parameters - component will fetch data"),
})

type SearchResultsProps = z.infer<typeof SearchResultsPropsSchema>

interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  thumbnail?: string
  source: string
  position?: number
  date?: string
  domain?: string
}

interface QuickActionState {
  isOpen: boolean
  action: 'bookmark' | 'schedule' | 'note' | null
  item: any
}

export function SearchResults({ searchRequest }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([])
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

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/search/web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchRequest),
        })

        if (!response.ok) throw new Error('Search failed')

        const data = await response.json()
        const fetchedResults = data.results || []
        
        // Enhance results with additional metadata
        const enhancedResults = fetchedResults.map((r: SearchResult, i: number) => ({
          ...r,
          position: i + 1,
          domain: new URL(r.url).hostname.replace('www.', ''),
        }))
        
        setResults(enhancedResults)
        
        console.log('📊 Search results available:', enhancedResults.length)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchRequest?.query, isStreaming])

  const handleQuickAction = (action: 'bookmark' | 'schedule' | 'note', result: SearchResult) => {
    setQuickAction({
      isOpen: true,
      action,
      item: {
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        type: 'article' as const,
        thumbnail: result.thumbnail,
      },
    })
  }

  /* ---------------- streaming state ---------------- */
  if (isStreaming) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-600 font-medium">Searching the web...</p>
          <p className="text-xs text-gray-500 mt-1">Fetching results from Google</p>
        </div>
      </div>
    )
  }

  /* ---------------- loading skeleton ---------------- */
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-linear-to-r from-white via-gray-50 to-white rounded-xl border border-gray-200 p-5 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="flex gap-2 mt-3">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
              </div>
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
        <p className="text-red-700 font-medium">Search Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  /* ---------------- empty ---------------- */
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <p className="text-gray-700 font-medium text-lg">No results found</p>
        <p className="text-gray-500 text-sm mt-1">Try a different search query for "{searchRequest.query}"</p>
      </div>
    )
  }

  /* ---------------- results ---------------- */
  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600" />
              Search Results
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Found <span className="font-semibold text-gray-900">{results.length}</span> results for 
              <span className="font-semibold text-blue-600"> "{searchRequest.query}"</span>
            </p>
          </div>
        </div>

        {/* Results Grid */}
        {results.map((result) => {
          const isHovered = hoveredId === result.id
          const isTopResult = result.position && result.position <= 3

          return (
            <div
              key={result.id}
              onMouseEnter={() => setHoveredId(result.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                group relative bg-white rounded-xl border-2 transition-all duration-200
                ${isHovered 
                  ? 'border-blue-500 shadow-lg shadow-blue-100 -translate-y-1' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isTopResult ? 'bg-linear-to-br from-blue-50/30 to-white' : ''}
              `}
            >
              {/* Top Result Badge */}
              {isTopResult && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <TrendingUp size={12} />
                    Top {result.position}
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {result.thumbnail && (
                    <div className="shrink-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Domain & Position */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        #{result.position}
                      </span>
                      <span className="text-xs text-gray-500">{result.domain}</span>
                      {result.date && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={10} />
                            {result.date}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-start gap-2 mb-2"
                    >
                      <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover/link:text-blue-600 transition-colors">
                        {result.title}
                      </h4>
                      <ExternalLink
                        size={14}
                        className="shrink-0 mt-1 text-gray-400 opacity-0 group-hover/link:opacity-100 transition-opacity"
                      />
                    </a>

                    {/* Snippet */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
                      {result.snippet}
                    </p>

                    {/* Source */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <span className="font-medium">{result.source}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleQuickAction('bookmark', result)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Bookmark size={13} />
                        Bookmark
                      </button>
                      <button
                        onClick={() => handleQuickAction('schedule', result)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Calendar size={13} />
                        Schedule
                      </button>
                      <button
                        onClick={() => handleQuickAction('note', result)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-green-600 bg-gray-100 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <FileText size={13} />
                        Save Note
                      </button>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <ExternalLink size={13} />
                        Visit
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover gradient border effect */}
              <div className={`
                absolute inset-0 rounded-xl bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 
                ${isHovered ? 'opacity-10' : ''}
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

export const searchResultsComponent = {
  name: 'SearchResults',
  description:
    'Displays web search results from Google with rich metadata, thumbnails, and quick actions. Features include bookmarking, scheduling, and note-taking for each result.',
  component: SearchResults,
  propsSchema: SearchResultsPropsSchema,
}
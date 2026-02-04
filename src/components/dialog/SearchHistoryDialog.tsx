// components/dialogs/SearchHistoryDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  thumbnail?: string
  source: string
}

interface SearchHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
}

export function SearchHistoryDialog({ isOpen, onClose, searchQuery }: SearchHistoryDialogProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Load results when dialog opens - FIXED: useEffect instead of useState
  useEffect(() => {
    if (isOpen && searchQuery) {
      loadSearchResults()
    }
  }, [isOpen, searchQuery])

  const loadSearchResults = async () => {
    setLoading(true)
    setResults([]) // Clear previous results
    
    try {
      console.log('🔍 Loading search results for:', searchQuery)
      
      const response = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          searchRequest: { 
            query: searchQuery,
            num: 10
          } 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Loaded', data.results?.length || 0, 'results')
        setResults(data.results || [])
      } else {
        console.error('❌ Search failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Failed to load search results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose} // Click backdrop to close
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Search Results</h2>
            <p className="text-sm text-gray-600 mt-1 truncate">"{searchQuery}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="ml-3 text-gray-600">Loading results...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-2">Try searching again from the Search tab</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3">
                    {result.thumbnail && (
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-20 h-20 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:text-blue-700 flex items-start gap-2 group"
                      >
                        <span className="line-clamp-2">{result.title}</span>
                        <ExternalLink size={14} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
                      </a>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{result.snippet}</p>
                      <p className="text-xs text-gray-500 mt-2">{result.source}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {results.length > 0 && `Showing ${results.length} results`}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
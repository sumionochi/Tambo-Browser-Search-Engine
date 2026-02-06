// components/interactable/AnalyticsGraph.tsx
'use client'

import { z } from 'zod'
import { useState } from 'react'
import { Graph } from '@/components/tambo/graph'
import { BarChart3, TrendingUp, Code, Search, Loader } from 'lucide-react'
import { EditWithTamboButton } from '@/components/tambo/edit-with-tambo-button'
import type { TamboComponent } from '@tambo-ai/react'

// Zod Schema
export const AnalyticsGraphPropsSchema = z.object({
  analysisType: z.enum(['search-trends', 'github-comparison', 'language-trends', 'source-analysis'])
    .optional()
    .describe("Type of analysis to perform"),
  queries: z.array(z.string())
    .optional()
    .describe("Topics or repositories to analyze"),
})

type AnalyticsGraphProps = z.infer<typeof AnalyticsGraphPropsSchema>

type AnalysisMode = 'search-trends' | 'github-comparison' | 'language-trends' | 'source-analysis'

interface ChartData {
  title: string
  data: {
    type: 'bar' | 'line' | 'pie'
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      color?: string
    }>
  }
}

export function AnalyticsGraph({ analysisType: initialType, queries: initialQueries }: AnalyticsGraphProps) {
  const [mode, setMode] = useState<AnalysisMode>(initialType || 'github-comparison')
  const [inputValue, setInputValue] = useState('')
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate colors for charts
  const generateColors = (count: number): string[] => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(34, 211, 238, 0.8)',   // Cyan
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(251, 191, 36, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
    ]
    return colors.slice(0, count)
  }

  // Analysis Functions
  const analyzeSearchTrends = async (topics: string[]) => {
    const results = []
    
    for (const topic of topics) {
      try {
        const response = await fetch('/api/search/web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: topic,
            filters: { num: 10 }
          })
        })
        
        if (!response.ok) throw new Error('Search failed')
        
        const data = await response.json()
        results.push({
          topic: topic.trim(),
          count: data.results?.length || 0
        })
      } catch (err) {
        console.error(`Search failed for ${topic}:`, err)
        results.push({
          topic: topic.trim(),
          count: 0
        })
      }
    }
    
    setChartData({
      title: 'Search Interest Comparison',
      data: {
        type: 'bar',
        labels: results.map(r => r.topic),
        datasets: [{
          label: 'Search Results',
          data: results.map(r => r.count),
          color: generateColors(results.length)[0],
        }]
      }
    })
  }

  const compareGitHubRepos = async (queries: string[]) => {
    const repos = []
    
    for (const query of queries) {
      try {
        const response = await fetch('/api/search/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: query.trim(),
            sort: 'stars'
          })
        })
        
        if (!response.ok) throw new Error('GitHub search failed')
        
        const data = await response.json()
        const topRepo = data.repos?.[0]
        
        if (topRepo) {
          repos.push({
            name: topRepo.name,
            stars: topRepo.stars,
            forks: topRepo.forks,
            watchers: topRepo.watchers || 0
          })
        }
      } catch (err) {
        console.error(`GitHub search failed for ${query}:`, err)
      }
    }
    
    if (repos.length === 0) {
      throw new Error('No repositories found')
    }
    
    setChartData({
      title: 'GitHub Repository Comparison',
      data: {
        type: 'bar',
        labels: repos.map(r => r.name),
        datasets: [
          {
            label: 'Stars',
            data: repos.map(r => r.stars),
            color: 'rgba(59, 130, 246, 0.6)',
          },
          {
            label: 'Forks',
            data: repos.map(r => r.forks),
            color: 'rgba(168, 85, 247, 0.6)',
          },
          {
            label: 'Watchers',
            data: repos.map(r => r.watchers),
            color: 'rgba(236, 72, 153, 0.6)',
          }
        ]
      }
    })
  }

  const analyzeLanguageTrends = async (topic: string) => {
    try {
      const response = await fetch('/api/search/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: topic,
          sort: 'stars'
        })
      })
      
      if (!response.ok) throw new Error('GitHub search failed')
      
      const data = await response.json()
      const repos = data.repos || []
      
      if (repos.length === 0) {
        throw new Error('No repositories found')
      }
      
      // Count languages
      const languageCounts: Record<string, number> = {}
      repos.forEach((repo: any) => {
        if (repo.language) {
          languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
        }
      })
      
      // Sort by count and take top 8
      const sortedLanguages = Object.entries(languageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
      
      setChartData({
        title: `Programming Languages in "${topic}"`,
        data: {
          type: 'pie',
          labels: sortedLanguages.map(([lang]) => lang),
          datasets: [{
            label: 'Repositories',
            data: sortedLanguages.map(([, count]) => count),
            color: 'rgba(59, 130, 246, 0.8)',
          }]
        }
      })
    } catch (err) {
      throw err
    }
  }

  const analyzeSearchSources = async (query: string) => {
    try {
      const response = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          filters: { num: 10 }
        })
      })
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      const results = data.results || []
      
      if (results.length === 0) {
        throw new Error('No search results found')
      }
      
      // Categorize sources
      const categories: Record<string, number> = {
        'News': 0,
        'Academic': 0,
        'Blogs': 0,
        'Commercial': 0,
        'Other': 0
      }
      
      results.forEach((result: any) => {
        const source = result.source?.toLowerCase() || ''
        const url = result.url?.toLowerCase() || ''
        
        if (source.includes('news') || source.includes('times') || source.includes('post')) {
          categories.News++
        } else if (url.includes('.edu') || source.includes('arxiv') || source.includes('academic')) {
          categories.Academic++
        } else if (source.includes('blog') || source.includes('medium') || url.includes('blog')) {
          categories.Blogs++
        } else if (url.includes('.com') || url.includes('.io')) {
          categories.Commercial++
        } else {
          categories.Other++
        }
      })
      
      // Filter out zero values
      const filteredCategories = Object.entries(categories)
        .filter(([, count]) => count > 0)
      
      setChartData({
        title: `Source Analysis: "${query}"`,
        data: {
          type: 'bar',
          labels: filteredCategories.map(([cat]) => cat),
          datasets: [{
            label: 'Sources',
            data: filteredCategories.map(([, count]) => count),
            color: generateColors(filteredCategories.length)[0],
          }]
        }
      })
    } catch (err) {
      throw err
    }
  }

  const handleAnalyze = async () => {
    if (!inputValue.trim()) {
      setError('Please enter topics to analyze')
      return
    }

    setLoading(true)
    setError(null)
    setChartData(null)

    try {
      const queries = inputValue.split(',').map(q => q.trim()).filter(Boolean)
      
      if (queries.length === 0) {
        throw new Error('Please enter valid topics')
      }

      switch (mode) {
        case 'search-trends':
          await analyzeSearchTrends(queries)
          break
        case 'github-comparison':
          await compareGitHubRepos(queries)
          break
        case 'language-trends':
          await analyzeLanguageTrends(queries[0])
          break
        case 'source-analysis':
          await analyzeSearchSources(queries[0])
          break
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const modes = [
    {
      id: 'github-comparison' as const,
      label: 'GitHub Compare',
      icon: Code,
      description: 'Compare repository statistics',
      placeholder: 'e.g., react, vue, svelte'
    },
    {
      id: 'search-trends' as const,
      label: 'Search Trends',
      icon: TrendingUp,
      description: 'Compare search interest',
      placeholder: 'e.g., AI startups, ML companies, tech firms'
    },
    {
      id: 'language-trends' as const,
      label: 'Language Trends',
      icon: BarChart3,
      description: 'Analyze programming languages',
      placeholder: 'e.g., machine learning'
    },
    {
      id: 'source-analysis' as const,
      label: 'Source Analysis',
      icon: Search,
      description: 'Categorize search sources',
      placeholder: 'e.g., quantum computing'
    }
  ]

  const currentMode = modes.find(m => m.id === mode)

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Analyze search trends, GitHub repositories, and more
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EditWithTamboButton 
              tooltip="Modify analysis with AI"
              description="Change analysis parameters or request different comparisons using natural language"
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Analysis Mode</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modes.map((m) => {
              const Icon = m.icon
              const isActive = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    setChartData(null)
                    setError(null)
                  }}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${isActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-600'} />
                  <p className={`font-medium mt-2 text-sm ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{m.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'github-comparison' && 'Repositories to Compare'}
                {mode === 'search-trends' && 'Topics to Compare'}
                {mode === 'language-trends' && 'Topic to Analyze'}
                {mode === 'source-analysis' && 'Search Query'}
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder={currentMode?.placeholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                {mode === 'github-comparison' || mode === 'search-trends' 
                  ? 'Separate multiple items with commas'
                  : 'Enter a single topic to analyze'
                }
              </p>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !inputValue.trim()}
              className="mt-7 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 size={18} />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Analyzing data...</p>
            <p className="text-gray-500 text-sm mt-1">This may take a few moments</p>
          </div>
        )}

        {/* Chart Display */}
        {chartData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Graph
              title={chartData.title}
              data={chartData.data}
              variant="bordered"
              size="lg"
              showLegend={true}
            />
          </div>
        )}

        {/* Empty State */}
        {!chartData && !loading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <BarChart3 size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Select an analysis mode, enter your topics, and click "Analyze" to generate insights
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">💡 Tip:</span> This analytics dashboard uses real data from Google Search and GitHub APIs to provide instant market research and competitive analysis.
          </p>
        </div>
      </div>
    </div>
  )
}

// Export as TamboComponent object (similar to other generative components)
export const analyticsGraphComponent: TamboComponent = {
  name: 'AnalyticsGraph',
  description: 'Advanced analytics dashboard for comparing search trends, GitHub repositories, programming languages, and source types using real-time data from Google and GitHub APIs.',
  component: AnalyticsGraph,
  propsSchema: AnalyticsGraphPropsSchema,
}
// components/generative/PexelsGrid.tsx
'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useTamboStreamStatus, useTamboComponentState } from '@tambo-ai/react'
import { 
  Edit, 
  Save, 
  ExternalLink, 
  AlertCircle, 
  Download,
  Heart,
  Eye,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  FileText,
  Bookmark
} from 'lucide-react'
import { ImageEditDialog } from '@/components/dialog/ImageEditDialog'
import { QuickActionDialog } from '@/components/dialog/QuickActionDialog'

export const PexelsGridPropsSchema = z.object({
  searchRequest: z.object({
    query: z.string().describe('Search query for images'),
    perPage: z.number().optional().describe('Number of images to fetch'),
  }).describe('Image search parameters'),
})

type PexelsGridProps = z.infer<typeof PexelsGridPropsSchema>

interface PexelsPhoto {
  id: string
  url: string
  imageUrl: string
  thumbnail: string
  photographer: string
  title: string
  width?: number
  height?: number
  avgColor?: string
}

interface EditDialogState {
  isOpen: boolean
  image: {
    imageIndex: number
    imageUrl: string
    title: string
    photographer: string
  } | null
}

interface QuickActionState {
  isOpen: boolean
  action: 'bookmark' | 'schedule' | 'note' | null
  item: any
}

export function PexelsGrid({ searchRequest }: PexelsGridProps) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    isOpen: false,
    image: null,
  })

  const [quickAction, setQuickAction] = useState<QuickActionState>({
    isOpen: false,
    action: null,
    item: null,
  })

  const [searchSessionId, setSearchSessionId] = useTamboComponentState(
    "pexels_search_session_id",
    "",
    ""
  )

  const { streamStatus } = useTamboStreamStatus()
  const isStreaming = !streamStatus.isSuccess && !streamStatus.isError

  useEffect(() => {
    if (!searchRequest?.query || isStreaming) return

    const fetchPhotos = async () => {
      setLoading(true)
      setError(null)
      setImageErrors(new Set())

      try {
        console.log('🖼️ Fetching Pexels images for:', searchRequest.query)
        
        const response = await fetch('/api/search/pexels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchRequest),
        })

        if (!response.ok) {
          throw new Error('Image search failed')
        }

        const data = await response.json()
        const fetchedPhotos = data.photos ?? []
        
        console.log('✅ Loaded', fetchedPhotos.length, 'photos')
        console.log('🔑 Search session ID:', data.searchSessionId)
        
        setPhotos(fetchedPhotos)
        setSearchSessionId(data.searchSessionId || '')
      } catch (err: any) {
        console.error('❌ Pexels error:', err)
        setError(err.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [searchRequest?.query, isStreaming])

  const handleImageError = (photoId: string) => {
    setImageErrors(prev => new Set(prev).add(photoId))
  }

  const handleEdit = (photo: PexelsPhoto, index: number) => {
    setEditDialog({
      isOpen: true,
      image: {
        imageIndex: index,
        imageUrl: photo.imageUrl,
        title: photo.title,
        photographer: photo.photographer,
      },
    })
  }

  const handleSave = (photo: PexelsPhoto) => {
    setQuickAction({
      isOpen: true,
      action: 'bookmark',
      item: {
        title: photo.title,
        url: photo.url,
        type: 'image' as const,
        thumbnail: photo.imageUrl,
      },
    })
  }

  const handleDownload = async (photo: PexelsPhoto) => {
    try {
      const response = await fetch(photo.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${photo.title.replace(/\s+/g, '-')}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      console.log('✅ Image downloaded')
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (isStreaming) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-600 font-medium">Searching images...</p>
          <p className="text-xs text-gray-500 mt-1">Finding beautiful photos on Pexels</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div
            key={i}
            className="mb-4 break-inside-avoid"
          >
            <div 
              className="bg-gray-200 rounded-xl animate-pulse"
              style={{ height: `${Math.random() * 200 + 200}px` }}
            />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <p className="text-red-700 font-medium">Image Search Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
          <ImageIcon size={32} className="text-purple-600" />
        </div>
        <p className="text-gray-700 font-medium text-lg">No images found</p>
        <p className="text-gray-500 text-sm mt-1">Try a different search for "{searchRequest.query}"</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg">
                <ImageIcon size={18} className="text-white" />
              </div>
              Image Gallery
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold text-gray-900">{photos.length}</span> photos for 
              <span className="font-semibold text-purple-600"> "{searchRequest.query}"</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye size={14} />
            <span>Hover to interact</span>
          </div>
        </div>

        {/* Pinterest-style Masonry Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {photos.map((photo, index) => {
            const hasError = imageErrors.has(photo.id)
            const isHovered = hoveredId === photo.id
            
            return (
              <div
                key={photo.id}
                onMouseEnter={() => setHoveredId(photo.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="mb-4 break-inside-avoid group"
              >
                <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-md hover:shadow-2xl transition-all duration-300">
                  {/* Position Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <div className="bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Image */}
                  {hasError ? (
                    <div className="w-full aspect-3/4 flex flex-col items-center justify-center bg-gray-200 text-gray-500">
                      <AlertCircle size={32} className="mb-2" />
                      <p className="text-xs">Image unavailable</p>
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2"
                      >
                        View on Pexels
                      </a>
                    </div>
                  ) : (
                    <>
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        crossOrigin="anonymous"
                        onError={() => handleImageError(photo.id)}
                        style={{ backgroundColor: photo.avgColor || '#f3f4f6' }}
                      />

                      {/* Overlay on hover */}
                      <div 
                        className={`
                          absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent
                          transition-opacity duration-300
                          ${isHovered ? 'opacity-100' : 'opacity-0'}
                        `}
                      >
                        <div className="absolute inset-0 p-4 flex flex-col justify-between">
                          {/* Top Actions */}
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDownload(photo)}
                              className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg transition-all hover:scale-110"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            <a
                              href={photo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg transition-all hover:scale-110"
                              title="View on Pexels"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>

                          {/* Bottom Info & Actions */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                {photo.title}
                              </p>
                              <p className="text-white/80 text-xs flex items-center gap-1">
                                <Heart size={10} />
                                by {photo.photographer}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleEdit(photo, index)}
                                className="flex items-center justify-center gap-1.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium py-2 rounded-lg transition-all shadow-lg hover:shadow-xl"
                              >
                                <Edit size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleSave(photo)}
                                className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 text-gray-900 text-xs font-medium py-2 rounded-lg transition-all shadow-lg hover:shadow-xl"
                              >
                                <Save size={12} />
                                Save
                              </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => setQuickAction({
                                  isOpen: true,
                                  action: 'schedule',
                                  item: {
                                    title: photo.title,
                                    url: photo.url,
                                    type: 'image' as const,
                                    thumbnail: photo.imageUrl,
                                  },
                                })}
                                className="flex-1 flex items-center justify-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs py-1.5 rounded transition-all"
                              >
                                <Calendar size={10} />
                              </button>
                              <button
                                onClick={() => setQuickAction({
                                  isOpen: true,
                                  action: 'note',
                                  item: {
                                    title: photo.title,
                                    url: photo.url,
                                    type: 'image' as const,
                                    thumbnail: photo.imageUrl,
                                  },
                                })}
                                className="flex-1 flex items-center justify-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs py-1.5 rounded transition-all"
                              >
                                <FileText size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pro tip */}
        <div className="bg-linear-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <Sparkles size={20} className="text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Pro Tip</p>
            <p className="text-xs text-gray-600 mt-1">
              Click <span className="font-semibold">Edit</span> to transform images with AI, or 
              <span className="font-semibold"> Save</span> to add them to your collections. 
              All edited images appear in the Studio tab!
            </p>
          </div>
        </div>
      </div>

      {/* Image Edit Dialog */}
      {editDialog.isOpen && editDialog.image && (
        <ImageEditDialog
          isOpen={editDialog.isOpen}
          onClose={() => setEditDialog({ isOpen: false, image: null })}
          image={editDialog.image}
        />
      )}

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

export const pexelsGridComponent = {
  name: 'PexelsGrid',
  description: `Pinterest-style image gallery with AI editing capabilities. Features include:
  - Masonry grid layout for beautiful presentation
  - AI-powered image editing with GPT-Image-1.5
  - Quick save to collections
  - Download and share functionality
  - Schedule reminders and create notes
  
  All edited images are saved to the Studio tab for later viewing.`,
  component: PexelsGrid,
  propsSchema: PexelsGridPropsSchema,
}
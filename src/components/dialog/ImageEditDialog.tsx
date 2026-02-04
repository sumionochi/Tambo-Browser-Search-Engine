// components/dialog/ImageEditDialog.tsx
'use client'

import { X, Sparkles, Loader } from 'lucide-react'
import { useState } from 'react'

interface ImageEditDialogProps {
  isOpen: boolean
  onClose: () => void
  image: {
    imageIndex: number
    imageUrl: string
    title: string
    photographer: string
  }
}

export function ImageEditDialog({ isOpen, onClose, image }: ImageEditDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [variations, setVariations] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleEdit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      console.log('🎨 Editing image:', {
        imageIndex: image.imageIndex,
        prompt,
        variations,
      })

      const response = await fetch('/api/tools/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageIndex: image.imageIndex,
          editPrompt: prompt,
          variationCount: variations,
        }),
      })

      if (response.ok) {
        console.log('✅ Image editing started')
        onClose()
        // Show success message or navigate to Studio tab
      } else {
        console.error('❌ Image editing failed')
      }
    } catch (error) {
      console.error('Image edit error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-linear-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Image with AI</h2>
              <p className="text-sm text-gray-600">Transform this image using AI generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100">
            <img
              src={image.imageUrl}
              alt={image.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm font-medium">{image.title}</p>
              <p className="text-white/80 text-xs">by {image.photographer}</p>
            </div>
          </div>

          {/* Edit Prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What would you like to change?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., make it sunset, add rain, change to winter scene..."
              className="w-full border-2 border-gray-300 focus:border-purple-500 rounded-lg px-4 py-3 text-sm outline-none resize-y min-h-[100px] transition-colors"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Be specific about what you want to add, remove, or change
            </p>
          </div>

          {/* Variations Count */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Number of variations
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="4"
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-2xl font-bold text-purple-600 w-8 text-center">
                {variations}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Faster</span>
              <span>More options</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">How it works:</span> Your image will be processed by GPT-Image-1.5 
              to generate {variations} variation{variations > 1 ? 's' : ''} based on your prompt. 
              Check the Studio tab to view results!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEdit}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Variations
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
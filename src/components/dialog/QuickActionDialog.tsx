// components/dialog/QuickActionDialog.tsx
'use client'

import { X, FolderPlus } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Collection {
  id: string
  name: string
}

interface QuickActionDialogProps {
  isOpen: boolean
  onClose: () => void
  action: 'bookmark' | 'schedule' | 'note'
  item: {
    title: string
    url: string
    snippet?: string
    type: 'article' | 'repo' | 'image'
    thumbnail?: string
  }
}

export function QuickActionDialog({ isOpen, onClose, action, item }: QuickActionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDatetime, setEventDatetime] = useState('')
  const [eventNote, setEventNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && action === 'bookmark') {
      loadCollections()
    }
    if (isOpen && action === 'schedule') {
      setEventTitle(item.title)
      setEventNote(`From: ${item.url}`)
    }
    if (isOpen && action === 'note') {
      setNoteContent(`${item.title}\n\n${item.snippet || ''}\n\nSource: ${item.url}`)
    }
  }, [isOpen, action])

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  const handleBookmark = async () => {
    setLoading(true)
    try {
      const collectionName = selectedCollection === 'new' ? newCollectionName : 
        collections.find(c => c.id === selectedCollection)?.name || ''

      const response = await fetch('/api/tools/collection/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName,
          items: [{
            type: item.type,
            url: item.url,
            title: item.title,
            thumbnail: item.thumbnail,
          }],
        }),
      })

      if (response.ok) {
        console.log('✅ Bookmarked successfully')
        onClose()
      }
    } catch (error) {
      console.error('Bookmark error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tools/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          datetime: new Date(eventDatetime).toISOString(),
          note: eventNote,
        }),
      })

      if (response.ok) {
        console.log('✅ Event scheduled')
        onClose()
      }
    } catch (error) {
      console.error('Schedule error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tools/note/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
        }),
      })

      if (response.ok) {
        console.log('✅ Note saved')
        onClose()
      }
    } catch (error) {
      console.error('Save note error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {action === 'bookmark' && 'Add to Collection'}
            {action === 'schedule' && 'Schedule Reminder'}
            {action === 'note' && 'Save as Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
            <p className="text-xs text-gray-500 mt-1">{item.url}</p>
          </div>

          {/* Bookmark Form */}
          {action === 'bookmark' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Collection
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Choose a collection...</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                  <option value="new">+ Create New Collection</option>
                </select>
              </div>

              {selectedCollection === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Collection Name
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Enter collection name..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </>
          )}

          {/* Schedule Form */}
          {action === 'schedule' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventDatetime}
                  onChange={(e) => setEventDatetime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y min-h-20"
                />
              </div>
            </>
          )}

          {/* Note Form */}
          {action === 'note' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y min-h-[150px]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (action === 'bookmark') handleBookmark()
              else if (action === 'schedule') handleSchedule()
              else if (action === 'note') handleSaveNote()
            }}
            disabled={loading || (action === 'bookmark' && !selectedCollection && !newCollectionName)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
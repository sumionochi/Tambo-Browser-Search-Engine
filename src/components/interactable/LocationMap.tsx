// components/interactable/LocationMap.tsx
'use client'

import { z } from 'zod'
import { useState } from 'react'
import { Map } from '@/components/tambo/map'
import type { TamboComponent } from '@tambo-ai/react'
import { Search, MapPin, Navigation, Bookmark, Loader } from 'lucide-react'
import { EditWithTamboButton } from '@/components/tambo/edit-with-tambo-button'

export const LocationMapPropsSchema = z.object({
  mode: z.enum(['place-search', 'city-explorer', 'saved-places', 'route-planner'])
    .optional()
    .describe("Type of map mode"),
  searchQuery: z.string()
    .optional()
    .describe("Initial search query"),
})

type LocationMapProps = z.infer<typeof LocationMapPropsSchema>
type MapMode = 'place-search' | 'city-explorer' | 'saved-places' | 'route-planner'

interface MapData {
  title: string
  center: { lat: number; lng: number }  // ← Fixed: object instead of tuple
  zoom: number
  markers: Array<{
    lat: number      // ← Fixed: lat/lng instead of position
    lng: number
    label: string
    id?: string
  }>
}

function LocationMap({ mode: initialMode, searchQuery }: LocationMapProps) {
  const [mode, setMode] = useState<MapMode>(initialMode || 'place-search')
  const [inputValue, setInputValue] = useState(searchQuery || '')
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search places using OpenStreetMap Nominatim API
  const searchPlaces = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&limit=10&` +
        `addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CodeFlow-LocationSearch/1.0'
          }
        }
      )
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      
      if (data.length === 0) {
        throw new Error('No locations found')
      }
      
      const markers = data.map((place: any, index: number) => ({
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        label: place.display_name.split(',')[0],
        id: `marker-${index}`
      }))
      
      setMapData({
        title: `Search Results: "${query}"`,
        center: { lat: markers[0].lat, lng: markers[0].lng },
        zoom: 12,
        markers
      })
    } catch (err: any) {
      throw err
    }
  }

  // Explore a city (find landmarks)
  const exploreCity = async (cityName: string) => {
    try {
      // Search for famous landmarks in the city
      const landmarks = ['museum', 'park', 'monument', 'church', 'square']
      const allMarkers: any[] = []
      
      for (const landmark of landmarks) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${landmark}+in+${encodeURIComponent(cityName)}&limit=5`,
          {
            headers: {
              'User-Agent': 'CodeFlow-LocationSearch/1.0'
            }
          }
        )
        
        const data = await response.json()
        allMarkers.push(...data.slice(0, 2)) // Take top 2 from each category
      }
      
      if (allMarkers.length === 0) {
        throw new Error('No landmarks found')
      }
      
      const markers = allMarkers.map((place: any, index: number) => ({
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        label: place.display_name.split(',')[0],
        id: `landmark-${index}`
      }))
      
      setMapData({
        title: `Exploring ${cityName}`,
        center: { lat: markers[0].lat, lng: markers[0].lng },
        zoom: 11,
        markers
      })
    } catch (err: any) {
      throw err
    }
  }

  // Load saved places from Collections
  const loadSavedPlaces = async () => {
    try {
      const response = await fetch('/api/collections')
      const data = await response.json()
      
      // Filter collections that have location data
      const locationItems = data.collections
        .flatMap((c: any) => c.items || [])
        .filter((item: any) => item.metadata?.location)
      
      if (locationItems.length === 0) {
        throw new Error('No saved locations found')
      }
      
      const markers = locationItems.map((item: any, index: number) => ({
        lat: item.metadata.location.coordinates.lat,
        lng: item.metadata.location.coordinates.lng,
        label: item.title,
        id: `saved-${index}`
      }))
      
      setMapData({
        title: 'Your Saved Places',
        center: { lat: markers[0].lat, lng: markers[0].lng },
        zoom: 10,
        markers
      })
    } catch (err: any) {
      throw err
    }
  }

  // Plan route between multiple locations
  const planRoute = async (locations: string[]) => {
    try {
      const allMarkers: any[] = []
      
      for (const location of locations) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            headers: {
              'User-Agent': 'CodeFlow-LocationSearch/1.0'
            }
          }
        )
        
        const data = await response.json()
        if (data[0]) {
          allMarkers.push(data[0])
        }
      }
      
      if (allMarkers.length === 0) {
        throw new Error('No locations found')
      }
      
      const markers = allMarkers.map((place: any, index: number) => ({
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        label: `Stop ${index + 1}: ${place.display_name.split(',')[0]}`,
        id: `route-${index}`
      }))
      
      // Calculate center point
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
      
      setMapData({
        title: 'Route Plan',
        center: { lat: avgLat, lng: avgLng },
        zoom: 10,
        markers
      })
    } catch (err: any) {
      throw err
    }
  }

  const handleSearch = async () => {
    if (!inputValue.trim() && mode !== 'saved-places') {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setError(null)
    setMapData(null)

    try {
      switch (mode) {
        case 'place-search':
          await searchPlaces(inputValue)
          break
        case 'city-explorer':
          await exploreCity(inputValue)
          break
        case 'saved-places':
          await loadSavedPlaces()
          break
        case 'route-planner':
          const locations = inputValue.split(',').map(l => l.trim())
          await planRoute(locations)
          break
      }
    } catch (err: any) {
      setError(err.message || 'Search failed')
      console.error('Map search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const modes = [
    {
      id: 'place-search' as const,
      label: 'Place Search',
      icon: Search,
      description: 'Search for any location',
      placeholder: 'e.g., coffee shops in Seattle'
    },
    {
      id: 'city-explorer' as const,
      label: 'City Explorer',
      icon: MapPin,
      description: 'Discover city landmarks',
      placeholder: 'e.g., Paris, Tokyo, New York'
    },
    {
      id: 'saved-places' as const,
      label: 'Saved Places',
      icon: Bookmark,
      description: 'View your saved locations',
      placeholder: 'Click search to load saved places'
    },
    {
      id: 'route-planner' as const,
      label: 'Route Planner',
      icon: Navigation,
      description: 'Plan a multi-stop route',
      placeholder: 'e.g., Eiffel Tower, Louvre, Arc de Triomphe'
    }
  ]

  const currentMode = modes.find(m => m.id === mode)

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Location Explorer</h2>
            <p className="text-sm text-gray-500 mt-1">
              Search, explore, and save locations around the world
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EditWithTamboButton 
              tooltip="Modify search with AI"
              description="Change location search or explore different places"
            />
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Exploration Mode</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modes.map((m) => {
              const Icon = m.icon
              const isActive = mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    setMapData(null)
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

        {/* Search Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'place-search' && 'Search Location'}
                {mode === 'city-explorer' && 'City to Explore'}
                {mode === 'saved-places' && 'Saved Places'}
                {mode === 'route-planner' && 'Route Stops (comma-separated)'}
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={currentMode?.placeholder}
                disabled={mode === 'saved-places'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                {mode === 'route-planner' 
                  ? 'Enter multiple locations separated by commas'
                  : mode === 'saved-places'
                  ? 'Click search to load your saved locations'
                  : 'Press Enter to search'
                }
              </p>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || (!inputValue.trim() && mode !== 'saved-places')}
              className="mt-7 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search
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
            <p className="text-gray-600 font-medium">Searching locations...</p>
            <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
          </div>
        )}

        {/* Map Display */}
        {mapData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Title Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {mapData.title}
              </h3>
            </div>
            
            {/* Map Container */}
            <div className="p-6">
              <Map
                center={mapData.center}
                zoom={mapData.zoom}
                markers={mapData.markers}
                zoomControl={true}
                size="lg"
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!mapData && !loading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <MapPin size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Explore
            </h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Select a mode and search for locations to get started
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">🗺️ Tip:</span> This map uses OpenStreetMap data to provide free, worldwide location search and visualization.
          </p>
        </div>
      </div>
    </div>
  )
}

export { LocationMap }

export const locationMapComponent: TamboComponent = {
  name: 'LocationMap',
  description: 'Interactive location search and map visualization with place search, city exploration, saved places, and route planning powered by OpenStreetMap.',
  component: LocationMap,
  propsSchema: LocationMapPropsSchema,
}
// components/MainWorkspace.tsx
'use client'

import { TamboProvider } from '@tambo-ai/react'
import { useState } from 'react'
import { NavigationBar } from './layout/NavigationBar'
import { MessageThreadFull } from '@/components/tambo/message-thread-full'
import { MessageThreadCollapsible } from '@/components/tambo/message-thread-collapsible'
import { CanvasSpace } from '@/components/tambo/canvas-space' 
import { ControlBar } from '@/components/tambo/control-bar'
import { useMcpServers } from '@/components/tambo/mcp-config-modal'
import { components, tools } from '@/lib/tambo'
import type { User } from '@supabase/supabase-js'

// Import interactable components
import { InteractableCollections } from './interactable/Collections'
import { InteractableCalendar } from './interactable/Calendar'
import { InteractableNotes } from './interactable/Notes'
import { InteractableImageStudio } from './interactable/ImageStudio'
import { AnalyticsGraph } from './interactable/AnalyticsGraph'
import { LocationMap } from './interactable/LocationMap'

type WorkspaceView = 'search' | 'collections' | 'calendar' | 'notes' | 'studio' | 'analytics' | 'map' | 'canvas'

interface MainWorkspaceProps {
  user: User
}

export function MainWorkspace({ user }: MainWorkspaceProps) {
  const [activeView, setActiveView] = useState<WorkspaceView>('search')
  const mcpServers = useMcpServers()

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Navigation Bar */}
        <NavigationBar
          activeView={activeView}
          onViewChange={setActiveView}
          userEmail={user.email!}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Search Mode: Full Message Thread */}
          {activeView === 'search' && (
            <MessageThreadFull />
          )}

          {/* Collections: Component + Collapsible Chat */}
          {activeView === 'collections' && (
            <div className="relative h-full">
              <InteractableCollections collections={[]} />
              <MessageThreadCollapsible
                defaultOpen={false}
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}

          {/* Calendar: Component + Collapsible Chat */}
          {activeView === 'calendar' && (
            <div className="relative h-full">
              <InteractableCalendar events={[]} />
              <MessageThreadCollapsible
                defaultOpen={false}
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}

          {/* Notes: Component + Collapsible Chat */}
          {activeView === 'notes' && (
            <div className="relative h-full">
              <InteractableNotes notes={[]} />
              <MessageThreadCollapsible
                defaultOpen={false}
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}

          {/* Studio: Component + Collapsible Chat */}
          {activeView === 'studio' && (
            <div className="relative h-full">
              <InteractableImageStudio 
                variations={[]}
                currentPrompt=""
              />
              <MessageThreadCollapsible
                defaultOpen={false}
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}

          {/* Analytics: Component + Collapsible Chat */}
          {activeView === 'analytics' && (
            <div className="relative h-full">
              <AnalyticsGraph />
              <MessageThreadCollapsible
                defaultOpen={false}
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}

          {/* Map: Component + Collapsible Chat */}
          {activeView === 'map' && (
            <div className="relative h-full">
              <LocationMap />
              <MessageThreadCollapsible
                defaultOpen={false}
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}

          {/* Canvas: CanvasSpace + Collapsible Chat */}
          {activeView === 'canvas' && (
            <div className="relative h-full">
              <div className="h-full bg-white">
                <CanvasSpace 
                  className="h-full w-full"
                />
              </div>
              <MessageThreadCollapsible
                defaultOpen={true}  // ← Open by default for Canvas mode
                height="80vh"
                className="absolute bottom-6 right-6 z-10"
              />
            </div>
          )}
        </div>

        {/* Floating Control Bar (Global Chat Shortcut - Cmd+K) */}
        <ControlBar />
      </div>
    </TamboProvider>
  )
}
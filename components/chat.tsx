'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import ChatPanel from '@/components/chat-panel'
import { ChatMessages } from '@/components/chat-messages'
import { useUIState } from 'ai/rsc'
import type { AI } from '@/app/actions'

type ChatProps = {
  id?: string
  query?: string
}

export function Chat({ id, query }: ChatProps) {
  const path = usePathname()
  const [messages] = useUIState<typeof AI>()

  const handleModelChange = useCallback((modelId: string) => {
    console.log('Model changed:', modelId)
  }, [])

  useEffect(() => {
    try {
      if (!path.includes('search') && messages.length === 1) {
        window.history.replaceState({}, '', `/search/${id}`)
      }
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [id, path, messages, query])

  if (!messages) {
    return null
  }

  return (
    <>
      {messages.length === 0 ? (
        <ChatPanel 
          messages={messages} 
          query={query}
          onModelChange={handleModelChange}
        />
      ) : (
        <div className="px-8 sm:px-12 pt-12 md:pt-14 pb-14 md:pb-24 max-w-3xl mx-auto flex flex-col space-y-3 md:space-y-4">
          <ChatMessages messages={messages} />
          <ChatPanel 
            messages={messages} 
            query={query}
            onModelChange={handleModelChange}
          />
        </div>
      )}
    </>
  )
}

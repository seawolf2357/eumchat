'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { ChatMessages } from './chat-messages'
import { useUIState } from 'ai/rsc'
import { EmptyScreen } from './empty-screen'

type ChatProps = {
  id?: string
  query?: string
}

export function Chat({ id, query }: ChatProps) {
  const path = usePathname()
  const router = useRouter()
  const [messages] = useUIState()

  useEffect(() => {
    try {
      if (!path.includes('search') && messages.length === 1) {
        window.history.replaceState({}, '', `/search/${id}`)
      }
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [id, path, messages, query])

  // 메시지 상태 유효성 검사
  if (!messages) {
    return <EmptyScreen />
  }

  return (
    <>
      {messages.length === 0 ? (
        <EmptyScreen />
      ) : (
        <div className="px-8 sm:px-12 pt-12 md:pt-14 pb-14 md:pb-24 max-w-3xl mx-auto flex flex-col space-y-3 md:space-y-4">
          <ChatMessages 
            messages={messages} 
            isLoading={false}
            error={null}
          />
          <ChatPanel 
            messages={messages} 
            query={query} 
            onError={(error) => {
              console.error('Chat error:', error)
            }}
          />
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ChatPanel } from './chat-panel'
import { ChatMessages } from './chat-messages'
import { useUIState, useAIState } from 'ai/rsc'
import { EmptyScreen } from './empty-screen'
import type { AI } from '@/app/actions'

type ChatProps = {
  id?: string
  query?: string
}

export function Chat({ id, query }: ChatProps) {
  const path = usePathname()
  const [messages, setMessages] = useUIState<typeof AI>()
  const [aiState, setAIState] = useAIState<typeof AI>()

  useEffect(() => {
    try {
      if (!path.includes('search') && messages.length === 1) {
        window.history.replaceState({}, '', `/search/${id}`)
      }
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [id, path, messages, query])

  const handleModelChange = useCallback((modelId: string) => {
    // 모델 변경 처리 로직
    console.log('Model changed:', modelId)
  }, [])

  // 메시지 상태 유효성 검사
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

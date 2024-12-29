'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
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
  const [messages, setMessages] = useUIState()

  useEffect(() => {
    try {
      if (!path.includes('search') && messages.length === 1) {
        window.history.replaceState({}, '', `/search/${id}`)
      }
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [id, path, messages, query])

  const handleSubmit = useCallback(async (message: string) => {
    try {
      // 메시지 전송 로직 구현
      // 예: API 호출 또는 상태 업데이트
      console.log('Submitting message:', message)
    } catch (error) {
      console.error('Failed to submit message:', error)
    }
  }, [])

  // 메시지 상태 유효성 검사
  if (!messages) {
    return <EmptyScreen submitMessage={handleSubmit} />
  }

  return (
    <>
      {messages.length === 0 ? (
        <EmptyScreen submitMessage={handleSubmit} />
      ) : (
        <div className="px-8 sm:px-12 pt-12 md:pt-14 pb-14 md:pb-24 max-w-3xl mx-auto flex flex-col space-y-3 md:space-y-4">
          <ChatMessages messages={messages} />
          <ChatPanel 
            messages={messages} 
            query={query}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </>
  )
}

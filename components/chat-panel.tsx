'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { AI } from '@/app/actions'
import { useUIState, useActions, useAIState } from 'ai/rsc'
import { cn } from '@/lib/utils'
import { UserMessage } from './user-message'
import { Button } from './ui/button'
import { ArrowRight, Plus } from 'lucide-react'
import { EmptyScreen } from './empty-screen'
import Textarea from 'react-textarea-autosize'
import { generateId } from 'ai'
import { useAppState } from '@/lib/utils/app-state'
import { ModelSelector } from './model-selector'
import { models } from '@/lib/types/models'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { getDefaultModelId } from '@/lib/utils'
import { toast } from 'sonner'

interface ChatPanelProps {
  messages: UIState
  query?: string
  onModelChange?: (id: string) => void
}

export function ChatPanel({ messages, query, onModelChange }: ChatPanelProps) {

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

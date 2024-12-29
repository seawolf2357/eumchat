'use client'

import { StreamableValue } from 'ai/rsc'
import type { UIState } from '@/lib/types'
import { CollapsibleMessage } from './collapsible-message'
import { useCallback, useMemo } from 'react'

interface ChatMessagesProps {
  messages: UIState
}

type GroupedMessage = {
  id: string
  components: React.ReactNode[]
  isCollapsed?: StreamableValue<boolean>
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  // 메시지 그룹화 로직을 useMemo로 최적화
  const groupedMessages = useMemo(() => {
    if (!messages.length) {
      return []
    }

    const grouped = messages.reduce<{ [key: string]: GroupedMessage }>(
      (acc, message) => {
        if (!acc[message.id]) {
          acc[message.id] = {
            id: message.id,
            components: [],
            isCollapsed: message.isCollapsed
          }
        }
        acc[message.id].components.push(message.component)
        return acc
      },
      {}
    )

    return Object.values(grouped)
  }, [messages])

  // 빈 메시지 처리
  if (!messages.length || !groupedMessages.length) {
    return null
  }

  return (
    <>
      {groupedMessages.map((groupedMessage) => (
        <CollapsibleMessage
          key={`${groupedMessage.id}`}
          message={{
            id: groupedMessage.id,
            component: groupedMessage.components.map((component, i) => (
              <div key={`${groupedMessage.id}-${i}`}>{component}</div>
            )),
            isCollapsed: groupedMessage.isCollapsed
          }}
          isLastMessage={groupedMessage.id === messages[messages.length - 1].id}
        />
      ))}
    </>
  )
}

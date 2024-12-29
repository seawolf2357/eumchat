'use client'

import { StreamableValue } from 'ai/rsc'
import type { UIState } from '@/lib/types'
import { CollapsibleMessage } from './collapsible-message'
import { useCallback, useMemo } from 'react'
import { createStreamableValue } from 'ai/rsc'

interface ChatMessagesProps {
  messages: UIState
}

type GroupedMessage = {
  id: string
  components: React.ReactNode[]
  isCollapsed?: StreamableValue<boolean>
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  if (!messages.length) {
    return null
  }

  // 메시지 그룹화 로직을 useMemo로 최적화
  const groupedMessages = useMemo(() => {
    const grouped = messages.reduce<{ [key: string]: GroupedMessage }>(
      (acc, message) => {
        if (!acc[message.id]) {
          // StreamableValue 생성
          const isCollapsed = createStreamableValue<boolean>()
          if (message.isCollapsed !== undefined) {
            isCollapsed.done(!!message.isCollapsed)
          }

          acc[message.id] = {
            id: message.id,
            components: [],
            isCollapsed
          }
        }
        acc[message.id].components.push(message.component)
        return acc
      },
      {}
    )

    return Object.values(grouped)
  }, [messages])

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

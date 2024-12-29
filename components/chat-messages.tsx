'use client'

import { StreamableValue } from 'ai/rsc'
import type { UIState } from '@/app/actions'
import { CollapsibleMessage } from './collapsible-message'
import { useCallback, useMemo } from 'react'

interface ChatMessagesProps {
  messages: UIState
}

type GroupedMessage = {
  id: string
  components: React.ReactNode[]
  isCollapsed?: StreamableValue<boolean> | undefined
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  // Hooks를 최상단에 배치
  const groupedMessagesArray = useMemo(() => {
    if (!messages?.length) {
      return []
    }

    try {
      const grouped = messages.reduce<{ [key: string]: GroupedMessage }>(
        (acc, message) => {
          if (!message?.id) return acc

          if (!acc[message.id]) {
            acc[message.id] = {
              id: message.id,
              components: [],
              isCollapsed: message.isCollapsed
            }
          }

          if (message.component) {
            acc[message.id].components.push(message.component)
          }

          return acc
        },
        {}
      )

      return Object.values(grouped).map(group => ({
        ...group,
        components: group.components as React.ReactNode[]
      }))
    } catch (error) {
      console.error('Error grouping messages:', error)
      return []
    }
  }, [messages])

  const isLastMessageId = useCallback(
    (id: string) => {
      if (!messages?.length) return false
      return id === messages[messages.length - 1].id
    },
    [messages]
  )

  // 렌더링 조건 체크
  if (!messages?.length || !groupedMessagesArray.length) {
    return null
  }

  return (
    <div className="flex flex-col space-y-4">
      {groupedMessagesArray.map((groupedMessage) => {
        if (!groupedMessage?.id) return null

        return (
          <CollapsibleMessage
            key={groupedMessage.id}
            message={{
              id: groupedMessage.id,
              component: (
                <div className="space-y-4">
                  {groupedMessage.components.map((component, i) => (
                    <div
                      key={`${groupedMessage.id}-${i}`}
                      className="message-component"
                    >
                      {component}
                    </div>
                  ))}
                </div>
              ),
              isCollapsed: groupedMessage.isCollapsed
            }}
            isLastMessage={isLastMessageId(groupedMessage.id)}
          />
        )
      })}
    </div>
  )
}

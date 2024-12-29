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
  // 메시지 유효성 검사
  if (!messages?.length) {
    return null
  }

  // 메시지 그룹화 로직을 useMemo로 최적화
  const groupedMessagesArray = useMemo(() => {
    try {
      // 메시지 그룹화
      const grouped = messages.reduce<{ [key: string]: GroupedMessage }>(
        (acc, message) => {
          if (!message?.id) return acc // 유효하지 않은 메시지 건너뛰기

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

      // 그룹화된 메시지를 배열로 변환
      return Object.values(grouped).map(group => ({
        ...group,
        components: group.components as React.ReactNode[]
      }))
    } catch (error) {
      console.error('Error grouping messages:', error)
      return []
    }
  }, [messages])

  // 마지막 메시지 ID 확인 함수
  const isLastMessageId = useCallback(
    (id: string) => {
      return messages.length > 0 && id === messages[messages.length - 1].id
    },
    [messages]
  )

  // 에러 상태 처리
  if (!groupedMessagesArray.length) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-gray-500">No messages to display</p>
      </div>
    )
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

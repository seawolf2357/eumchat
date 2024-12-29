'use server'

import {
  StreamableValue,
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState
} from 'ai/rsc'
import { CoreMessage, generateId } from 'ai'
import { Section } from '@/components/section'
import { FollowupPanel } from '@/components/followup-panel'
import { saveChat } from '@/lib/actions/chat'
import { Chat, AIMessage, AIState, UIState } from '@/lib/types'
import { UserMessage } from '@/components/user-message'
import { SearchSection } from '@/components/search-section'
import SearchRelated from '@/components/search-related'
import { CopilotDisplay } from '@/components/copilot-display'
import RetrieveSection from '@/components/retrieve-section'
import { VideoSearchSection } from '@/components/video-search-section'
import { AnswerSection } from '@/components/answer-section'
import { workflow } from '@/lib/actions/workflow'
import { isProviderEnabled } from '@/lib/utils/registry'

const MAX_MESSAGES = 6

const submit = async (
  formData?: FormData,
  skip?: boolean,
  retryMessages?: AIMessage[]
): Promise<{
  id: string
  isGenerating: StreamableValue<boolean>
  component: React.ReactNode
  isCollapsed: StreamableValue<boolean>
}> => {
  const aiState = getMutableAIState<typeof AI>()
  const uiStream = createStreamableUI()
  const isGenerating = createStreamableValue(true)
  const isCollapsed = createStreamableValue(false)

  try {
    const aiMessages = [...(retryMessages ?? aiState.get().messages)]
    const messages: CoreMessage[] = aiMessages
      .filter(
        message =>
          message.role !== 'tool' &&
          message.type !== 'followup' &&
          message.type !== 'related' &&
          message.type !== 'end'
      )
      .map(message => ({
        role: message.role,
        content: message.content
      }))

    messages.splice(0, Math.max(messages.length - MAX_MESSAGES, 0))

    const userInput = skip ? `{"action": "skip"}` : formData?.get('input') as string
    const content = skip
      ? userInput
      : formData
      ? JSON.stringify(Object.fromEntries(formData))
      : null

    const type = skip
      ? undefined
      : formData?.has('input')
      ? 'input'
      : formData?.has('related_query')
      ? 'input_related'
      : 'inquiry'

    const model = (formData?.get('model') as string) || 'openai:gpt-4o-mini'
    const providerId = model.split(':')[0]

    if (!isProviderEnabled(providerId)) {
      throw new Error(
        `Provider ${providerId} is not available (API key not configured or base URL not set)`
      )
    }

    if (content) {
      const newMessage: AIMessage = {
        id: generateId(),
        role: 'user',
        content,
        type
      }

      aiState.update({
        ...aiState.get(),
        messages: [...aiState.get().messages, newMessage]
      })

      messages.push({
        role: 'user',
        content
      })
    }

    await workflow(
      { uiStream, isCollapsed, isGenerating },
      aiState,
      messages,
      skip ?? false,
      model
    )

    return {
      id: generateId(),
      isGenerating: isGenerating.value,
      component: uiStream.value,
      isCollapsed: isCollapsed.value
    }
  } catch (error) {
    console.error('Submit error:', error)
    isGenerating.done(false)
    throw error
  }
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submit
  },
  initialUIState: [],
  initialAIState: {
    chatId: generateId(),
    messages: []
  },
  onGetUIState: async () => {
    const aiState = getAIState()
    return aiState ? getUIStateFromAIState(aiState as Chat) : undefined
  },
  onSetAIState: async ({ state }) => {
    if (!state.messages.some(e => e.type === 'answer')) return

    try {
      const chat: Chat = {
        id: state.chatId,
        createdAt: new Date(),
        userId: 'anonymous',
        path: `/search/${state.chatId}`,
        title: state.messages.length > 0
          ? JSON.parse(state.messages[0].content)?.input?.substring(0, 100) || 'Untitled'
          : 'Untitled',
        messages: [
          ...state.messages,
          {
            id: generateId(),
            role: 'assistant',
            content: 'end',
            type: 'end'
          }
        ]
      }
      await saveChat(chat)
    } catch (error) {
      console.error('Save chat error:', error)
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat): UIState => {
  const { chatId, isSharePage, messages } = aiState
  
  if (!Array.isArray(messages)) return []

  return messages
    .map((message, index) => {
      const { role, type } = message

      if (!type || type === 'end' || (isSharePage && ['related', 'followup'].includes(type))) {
        return null
      }

      switch (role) {
        case 'user':
          return processUserMessage(message, index, chatId, isSharePage ?? false)
        case 'assistant':
          return processAssistantMessage(message)
        case 'tool':
          return processToolMessage(message)
        default:
          return null
      }
    })
    .filter((message): message is NonNullable<typeof message> => message !== null)
}

function processUserMessage(message: AIMessage, index: number, chatId: string, isSharePage: boolean) {
  const { type, content, id } = message
  
  switch (type) {
    case 'input':
    case 'input_related':
      const json = JSON.parse(content)
      const value = type === 'input' ? json.input : json.related_query
      return {
        id,
        component: (
          <UserMessage
            message={value}
            chatId={chatId}
            showShare={index === 0 && !isSharePage}
          />
        )
      }
    case 'inquiry':
      return {
        id,
        component: <CopilotDisplay content={content} />
      }
    default:
      return null
  }
}

function processAssistantMessage(message: AIMessage) {
  const { type, content, id } = message
  const answer = createStreamableValue()
  answer.done(content)

  switch (type) {
    case 'answer':
      return {
        id,
        component: <AnswerSection result={answer.value} />
      }
    case 'related':
      const relatedQueries = createStreamableValue()
      relatedQueries.done(JSON.parse(content))
      return {
        id,
        component: <SearchRelated relatedQueries={relatedQueries.value} />
      }
    case 'followup':
      return {
        id,
        component: (
          <Section title="Follow-up" className="pb-8">
            <FollowupPanel />
          </Section>
        )
      }
    default:
      return null
  }
}

function processToolMessage(message: AIMessage) {
  try {
    const { content, id, name } = message
    const toolOutput = JSON.parse(content)
    const isCollapsed = createStreamableValue()
    isCollapsed.done(true)
    const searchResults = createStreamableValue()
    searchResults.done(JSON.stringify(toolOutput))

    switch (name) {
      case 'search':
        return {
          id,
          component: <SearchSection result={searchResults.value} />,
          isCollapsed: isCollapsed.value
        }
      case 'retrieve':
        return {
          id,
          component: <RetrieveSection data={toolOutput} />,
          isCollapsed: isCollapsed.value
        }
      case 'videoSearch':
        return {
          id,
          component: <VideoSearchSection result={searchResults.value} />,
          isCollapsed: isCollapsed.value
        }
      default:
        return null
    }
  } catch (error) {
    console.error('Tool message processing error:', error)
    return null
  }
}

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

interface ChatPanelProps {
  messages: UIState
  query?: string
  onModelChange?: (id: string) => void
}

export default function ChatPanel({ messages, query, onModelChange }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const [, setMessages] = useUIState<typeof AI>()
  const [aiMessage, setAIMessage] = useAIState<typeof AI>()
  const { isGenerating, setIsGenerating } = useAppState()
  const { submit } = useActions()
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)

  const [selectedModelId, setSelectedModelId] = useLocalStorage<string>(
    'selectedModel',
    getDefaultModelId(models)
  )

  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  async function handleQuerySubmit(query: string, formData?: FormData) {
    setInput(query)
    setIsGenerating(true)

    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: generateId(),
        component: <UserMessage message={query} />
      }
    ])

    const data = formData || new FormData()
    const modelString = selectedModelId
    data.set('model', modelString)

    if (!formData) {
      data.set('input', query)
    }

    try {
      const responseMessage = await submit(data)
      setMessages(currentMessages => [...currentMessages, responseMessage])
    } catch (error) {
      console.error('Query submission error:', error)
      toast.error(`Error: ${error}`)
      handleClear()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await handleQuerySubmit(input, formData)
  }

  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      handleQuerySubmit(query)
      isFirstRender.current = false
    }
  }, [query])

  useEffect(() => {
    const lastMessage = aiMessage.messages.slice(-1)[0]
    if (lastMessage?.type === 'followup' || lastMessage?.type === 'inquiry') {
      setIsGenerating(false)
    }
  }, [aiMessage, setIsGenerating])

  const handleClear = () => {
    setIsGenerating(false)
    setMessages([])
    setAIMessage({ messages: [], chatId: '' })
    setInput('')
    router.push('/')
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (messages.length > 0) {
    return (
      <div className="fixed bottom-2 md:bottom-8 left-0 right-0 flex justify-center items-center mx-auto pointer-events-none">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full bg-secondary/80 group transition-all hover:scale-105 pointer-events-auto"
          onClick={handleClear}
          disabled={isGenerating}
        >
          <span className="text-sm mr-2 group-hover:block hidden animate-in fade-in duration-300">
            New
          </span>
          <Plus size={18} className="group-hover:rotate-90 transition-all" />
        </Button>
      </div>
    )
  }

  if (query && query.trim().length > 0) {
    return null
  }

  return (
    <div className="fixed bottom-8 left-0 right-0 top-10 mx-auto h-screen flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="max-w-2xl w-full px-6">
        <div className="relative flex items-center w-full">
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={id => {
              setSelectedModelId(id)
              onModelChange?.(id)
            }}
          />
          <Textarea
            ref={inputRef}
            name="input"
            rows={1}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask a question..."
            spellCheck={false}
            value={input}
            className="resize-none w-full min-h-12 rounded-fill bg-muted border border-input pl-4 pr-10 pt-3 pb-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => {
              setInput(e.target.value)
              setShowEmptyScreen(e.target.value.length === 0)
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault()
                  return
                }
                e.preventDefault()
                const textarea = e.target as HTMLTextAreaElement
                textarea.form?.requestSubmit()
              }
            }}
            onHeightChange={height => {
              if (!inputRef.current) return
              const initialHeight = 70
              const initialBorder = 32
              const multiple = (height - initialHeight) / 20
              const newBorder = initialBorder - 4 * multiple
              inputRef.current.style.borderRadius = `${Math.max(8, newBorder)}px`
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            disabled={input.length === 0}
          >
            <ArrowRight size={20} />
          </Button>
        </div>
        <EmptyScreen
          submitMessage={message => {
            setInput(message)
          }}
          className={cn(showEmptyScreen ? 'visible' : 'invisible')}
        />
      </form>
    </div>
  )
}

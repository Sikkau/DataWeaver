import { getProviderConfig } from '@/lib/llm-providers'
import type { LLMProviderType } from '@/types'
import type { ChatMessage } from '@/stores/useChatStore'

export interface ChatConfig {
  provider: LLMProviderType
  apiKey: string
  baseUrl: string
  model: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

function formatMessagesForProvider(
  messages: ChatMessage[],
  provider: LLMProviderType
): OpenAIMessage[] | AnthropicMessage[] {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

  if (provider === 'anthropic') {
    return formattedMessages as AnthropicMessage[]
  }

  return formattedMessages as OpenAIMessage[]
}

function buildHeaders(config: ChatConfig): HeadersInit {
  const providerConfig = getProviderConfig(config.provider)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  switch (providerConfig.authType) {
    case 'bearer':
      headers['Authorization'] = `Bearer ${config.apiKey}`
      break
    case 'custom-header':
      if (providerConfig.authHeader) {
        headers[providerConfig.authHeader] = config.apiKey
      }
      break
    case 'query-param':
      // Handled in URL
      break
  }

  if (config.provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
  }

  return headers
}

function buildEndpoint(config: ChatConfig): string {
  const providerConfig = getProviderConfig(config.provider)
  let endpoint = config.baseUrl

  if (config.provider === 'anthropic') {
    endpoint += '/v1/messages'
  } else if (config.provider === 'google') {
    endpoint += `/v1beta/models/${config.model}:streamGenerateContent?alt=sse`
    if (providerConfig.authType === 'query-param') {
      endpoint += `&key=${config.apiKey}`
    }
  } else {
    endpoint += '/v1/chat/completions'
  }

  return endpoint
}

function buildRequestBody(
  messages: ChatMessage[],
  config: ChatConfig
): string {
  if (config.provider === 'anthropic') {
    return JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      messages: formatMessagesForProvider(messages, config.provider),
      stream: true,
    })
  }

  if (config.provider === 'google') {
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    return JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 4096,
      },
    })
  }

  // OpenAI and compatible providers
  return JSON.stringify({
    model: config.model,
    messages: formatMessagesForProvider(messages, config.provider),
    stream: true,
  })
}

async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  provider: LLMProviderType,
  callbacks: StreamCallbacks
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        callbacks.onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          continue
        }

        if (!trimmedLine.startsWith('data: ')) {
          continue
        }

        const jsonStr = trimmedLine.slice(6)

        try {
          const data = JSON.parse(jsonStr)
          let token = ''

          if (provider === 'anthropic') {
            if (data.type === 'content_block_delta') {
              token = data.delta?.text || ''
            }
          } else if (provider === 'google') {
            token = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          } else {
            // OpenAI and compatible
            token = data.choices?.[0]?.delta?.content || ''
          }

          if (token) {
            callbacks.onToken(token)
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  config: ChatConfig,
  callbacks: StreamCallbacks
): Promise<void> {
  const endpoint = buildEndpoint(config)
  const headers = buildHeaders(config)
  const body = buildRequestBody(messages, config)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
      } catch {
        if (errorText) {
          errorMessage = errorText
        }
      }

      throw new Error(errorMessage)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    await parseSSEStream(reader, config.provider, callbacks)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export const chatApi = {
  sendMessage: sendChatMessage,
}

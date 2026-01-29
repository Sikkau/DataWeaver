import { getProviderConfig } from '@/lib/llm-providers'
import type { LLMProviderType } from '@/types'

export interface AIGenerateConfig {
  provider: LLMProviderType
  apiKey: string
  baseUrl: string
  model: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface AnthropicResponse {
  content: Array<{
    type: string
    text?: string
  }>
}

interface GoogleResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

function buildHeaders(config: AIGenerateConfig): HeadersInit {
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
  }

  if (config.provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
  }

  return headers
}

function buildEndpoint(config: AIGenerateConfig): string {
  const providerConfig = getProviderConfig(config.provider)
  let endpoint = config.baseUrl

  if (config.provider === 'anthropic') {
    endpoint += '/v1/messages'
  } else if (config.provider === 'google') {
    endpoint += `/v1beta/models/${config.model}:generateContent`
    if (providerConfig.authType === 'query-param') {
      endpoint += `?key=${config.apiKey}`
    }
  } else {
    endpoint += '/v1/chat/completions'
  }

  return endpoint
}

function buildRequestBody(prompt: string, config: AIGenerateConfig): string {
  if (config.provider === 'anthropic') {
    return JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
  }

  if (config.provider === 'google') {
    return JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
      },
    })
  }

  // OpenAI and compatible providers
  return JSON.stringify({
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  })
}

function parseResponse(data: unknown, provider: LLMProviderType): string {
  if (provider === 'anthropic') {
    const response = data as AnthropicResponse
    const textContent = response.content?.find(c => c.type === 'text')
    return textContent?.text || ''
  }

  if (provider === 'google') {
    const response = data as GoogleResponse
    return response.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  // OpenAI and compatible providers
  const response = data as OpenAIResponse
  return response.choices?.[0]?.message?.content || ''
}

export async function generateWithAI(
  prompt: string,
  config: AIGenerateConfig
): Promise<string> {
  const endpoint = buildEndpoint(config)
  const headers = buildHeaders(config)
  const body = buildRequestBody(prompt, config)

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

  const data = await response.json()
  return parseResponse(data, config.provider)
}

// Generate tool description from query information
export async function generateToolDescription(
  queryName: string,
  querySql: string,
  queryParameters: Array<{ name: string; type: string; description?: string }>,
  config: AIGenerateConfig
): Promise<string> {
  const paramsDescription = queryParameters.length > 0
    ? queryParameters.map(p => `- ${p.name} (${p.type}): ${p.description || 'No description'}`).join('\n')
    : 'No parameters'

  const prompt = `You are a technical writer. Generate a clear, concise description for an MCP (Model Context Protocol) tool based on the following SQL query information.

The description should:
1. Explain what the tool does in 1-2 sentences
2. Be written for AI models that will use this tool
3. Include any important details about the parameters
4. Be professional and technical

Query Name: ${queryName}

SQL Query:
\`\`\`sql
${querySql}
\`\`\`

Parameters:
${paramsDescription}

Please provide ONLY the description text, without any additional formatting or explanation. The description should be in the same language as the query name (if the query name is in Chinese, write the description in Chinese; if in English, write in English).`

  return generateWithAI(prompt, config)
}

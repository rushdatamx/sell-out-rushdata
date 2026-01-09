// Generación de insights con Claude AI

import Anthropic from '@anthropic-ai/sdk'
import type { DigestData, DigestType } from './types'
import { getDigestPrompt, SYSTEM_PROMPT_DIGEST } from './prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface GenerateInsightsResult {
  insights: string
  tokensUsed: number
}

export async function generateDigestInsights(
  data: DigestData,
  digestType: DigestType
): Promise<GenerateInsightsResult> {
  const prompt = getDigestPrompt(data, digestType)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT_DIGEST,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  const insights = textContent ? textContent.text : ''

  return {
    insights,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  }
}

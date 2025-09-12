import { NextResponse } from 'next/server'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })
  }

  const referer = process.env.OPENROUTER_SITE_URL
  const title = process.env.OPENROUTER_SITE_NAME

  let body: { messages?: ChatMessage[]; model?: string; stream?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = body.messages ?? []
  // Prepend a system prompt so the assistant knows it's talking to Noah
  const hasSystem = messages.some((m) => m.role === 'system')
  const finalMessages: ChatMessage[] = hasSystem
    ? messages
    : [
        {
          role: 'system',
          content:
            'You are a helpful home assistant. You are speaking with Noah. Be concise, friendly, and address them as Noah when appropriate.',
        },
        ...messages,
      ]
  const model = body.model ?? 'nvidia/nemotron-nano-9b-v2'
  const stream = body.stream === true

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        ...(title ? { 'X-Title': title } : {}),
      },
      body: JSON.stringify({ model, messages: finalMessages, ...(stream ? { stream: true } : {}) }),
      // Cache control: do not cache chat responses
      cache: 'no-store',
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return NextResponse.json(
        { error: 'Upstream error', status: upstream.status, body: text },
        { status: 502 },
      )
    }

    if (stream) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }

    const data = await upstream.json()
    const content: string | undefined = data?.choices?.[0]?.message?.content
    return NextResponse.json({ content: content ?? '' })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}



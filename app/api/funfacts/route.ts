import { NextResponse } from 'next/server'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY
  const isDev = process.env.NODE_ENV !== 'production'
  const demoMarkdown = [
    '- **Gradient descent** powers many ML models by following the steepest slope.',
    '- The term **"overfitting"** means a model memorizes noise instead of patterns.',
    '- **Regularization** (like L2) gently pulls weights toward zero to reduce variance.',
    '- **Confusion matrix** helps you see false positives vs false negatives at a glance.',
    '- **Transformers** use attention to focus on relevant tokens—great for language tasks.',
    '- **Embeddings** map words, images, or users to vectors so distances mean similarity.',
    '- **A/B tests** are miniature experiments to compare changes with real users.',
    '- **Drift** happens when data changes over time; monitoring prevents silent failures.',
  ].join('\n')
  if (!apiKey && isDev) {
    return NextResponse.json({ content: demoMarkdown, demo: true })
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })
  }

  const referer = process.env.OPENROUTER_SITE_URL
  const title = process.env.OPENROUTER_SITE_NAME
  const model = process.env.OPENROUTER_FUNFACTS_MODEL || 'moonshotai/kimi-k2:free'

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a personal tutor that teaches the user about the topic they are interested in. You will be given a topic and you will need to teach the user about the topic. Respond with a clear and concise response. Do not use any affirmative language, just go right into the topic.',
    },
    {
      role: 'user',
      content:
        'Teach me something about data science, deep learning, machine learning, artificial intelligence, and other related topics. Or give me a quick overview of a specific topic. Or give me an idea for a research project. Or give me a list of resources to learn more about the topic. Or give me a list of questions to ask the user to help them learn more about the topic.',
    },
  ]

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        ...(title ? { 'X-Title': title } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 1.0,
      }),
      cache: 'no-store',
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      if (isDev) {
        return NextResponse.json({ content: demoMarkdown, demo: true })
      }
      return NextResponse.json(
        { error: 'Upstream error', status: upstream.status, body: text },
        { status: 502 },
      )
    }

    const data = await upstream.json()
    console.log('data', data.choices[0])
    const content: string | undefined = data?.choices?.[0]?.message?.content
    return NextResponse.json({ content: content ?? '' }, { status: 200 })
  } catch (e) {
    if (isDev) {
      return NextResponse.json({ content: demoMarkdown, demo: true })
    }
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}



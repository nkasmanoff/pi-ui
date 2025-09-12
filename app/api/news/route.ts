import { NextResponse } from 'next/server'

type NewsItem = {
  id: string
  title: string
  url: string
  source: string
  publishedAt?: string
}

export async function GET() {
  const gnewsKey = process.env.GNEWS_API_KEY

  // Try GNews first if key is provided
  if (gnewsKey) {
    const url = new URL('https://gnews.io/api/v4/top-headlines')
    url.searchParams.set('token', gnewsKey)
    url.searchParams.set('lang', 'en')
    url.searchParams.set('country', 'us')
    url.searchParams.set('max', '10')

    try {
      const res = await fetch(url.toString(), {
        next: { revalidate: 300 },
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json(
          { error: 'Upstream error', provider: 'gnews', status: res.status, body: text },
          { status: 502 },
        )
      }
      const data = await res.json()
      const items: NewsItem[] = Array.isArray(data?.articles)
        ? data.articles.map((a: any) => ({
            id: String(a?.url ?? a?.title ?? Math.random()),
            title: String(a?.title ?? 'Untitled'),
            url: String(a?.url ?? '#'),
            source: String(a?.source?.name ?? 'GNews'),
            publishedAt: a?.publishedAt ? String(a.publishedAt) : undefined,
          }))
        : []
      return NextResponse.json({ items })
    } catch (err) {
      return NextResponse.json({ error: 'Request failed (gnews)' }, { status: 500 })
    }
  }

  // Fallback: Hacker News front page via Algolia (no API key required)
  try {
    const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10', {
      next: { revalidate: 300 },
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Upstream error', provider: 'hn', status: res.status, body: text },
        { status: 502 },
      )
    }
    const data = await res.json()
    const items: NewsItem[] = Array.isArray(data?.hits)
      ? data.hits.map((h: any) => ({
          id: String(h?.objectID ?? Math.random()),
          title: String(h?.title ?? 'Untitled'),
          url: String(h?.url ?? `https://news.ycombinator.com/item?id=${h?.objectID}`),
          source: 'Hacker News',
          publishedAt: h?.created_at ? String(h.created_at) : undefined,
        }))
      : []
    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: 'Request failed (hn)' }, { status: 500 })
  }
}



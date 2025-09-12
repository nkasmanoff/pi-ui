import { NextResponse } from 'next/server'

type NasaItem = {
  id: string
  title: string
  url: string
  hdurl?: string
  date?: string
  explanation?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY'
  const count = Math.min(Math.max(Number(searchParams.get('count') || '8'), 1), 20)

  const url = new URL('https://api.nasa.gov/planetary/apod')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('count', String(count))

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Upstream error', status: res.status, body: text },
        { status: 502 },
      )
    }
    const data = await res.json()
    const items: NasaItem[] = (Array.isArray(data) ? data : [data])
      .filter((d: any) => d?.media_type === 'image' && (d?.url || d?.hdurl))
      .map((d: any) => ({
        id: String(d?.date ?? d?.url ?? Math.random()),
        title: String(d?.title ?? 'NASA Image'),
        url: String(d?.url ?? d?.hdurl),
        hdurl: d?.hdurl ? String(d.hdurl) : undefined,
        date: d?.date ? String(d.date) : undefined,
        explanation: d?.explanation ? String(d.explanation) : undefined,
      }))
    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}



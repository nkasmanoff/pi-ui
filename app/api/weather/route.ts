import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat') ?? '40.7128'
  const lon = searchParams.get('lon') ?? '-73.9656'
  const apiKey = process.env.TOMORROWIO_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing TOMORROWIO_API_KEY' },
      { status: 500 },
    )
  }

  const url = new URL('https://api.tomorrow.io/v4/weather/forecast')
  url.searchParams.set('location', `${lat},${lon}`)
  url.searchParams.set(
    'fields',
    [
      'temperature',
      'humidity',
      'temperatureMax',
      'temperatureMin',
      'weatherCode',
    ].join(','),
  )
  url.searchParams.set('units', 'imperial')
  url.searchParams.set('apikey', apiKey)

  try {
    const res = await fetch(url.toString(), {
      // Revalidate periodically; adjust as needed
      next: { revalidate: 300 },
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Upstream error', status: res.status, body: text },
        { status: 502 },
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}



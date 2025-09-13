"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Newspaper,
  Cloud,
  MessageCircle,
  Timer,
  MapPin,
  Thermometer,
  Send,
  Bot,
  User,
  Wifi,
  Battery,
  Settings,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
} from "lucide-react"

type ChatMessage = { id: number; text: string; sender: 'user' | 'bot' }

export default function KioskUI() {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatAbortRef = useRef<AbortController | null>(null)

  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)

  // AI Fun Facts (OpenRouter via /api/funfacts)
  const [funFactsMd, setFunFactsMd] = useState<string>("")
  const [funFactsLoading, setFunFactsLoading] = useState(false)
  const [funFactsError, setFunFactsError] = useState<string | null>(null)

  async function loadFunFacts() {
    setFunFactsLoading(true)
    setFunFactsError(null)
    try {
      const res = await fetch('/api/funfacts', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch fun facts')
      const data = await res.json()
      setFunFactsMd(String(data?.content ?? ''))
      toast({ title: 'AI Fun Facts updated', description: 'New facts loaded.' })
    } catch (e: any) {
      setFunFactsError(e?.message ?? 'Fun facts unavailable')
    } finally {
      setFunFactsLoading(false)
    }
  }

  // Weather (Tomorrow.io via /api/weather)
  const [weather, setWeather] = useState<{
    temperature: number
    humidity: number
    high: number
    low: number
    code: number
    description: string
  } | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // Expose re-usable loaders for refresh buttons
  async function loadWeather() {
    setWeatherLoading(true)
    setWeatherError(null)
    try {
      const res = await fetch(`/api/weather?lat=40.7826&lon=-73.9656`)
      if (!res.ok) throw new Error('Failed to fetch weather')
      const data = await res.json()
      const hourly = data?.timelines?.hourly?.[0]?.values
      const daily = data?.timelines?.daily?.[0]?.values
      const code = Number(hourly?.weatherCode ?? daily?.weatherCode ?? 0)
      const parsed = {
        temperature: Number(hourly?.temperature ?? NaN),
        humidity: Number(hourly?.humidity ?? NaN),
        high: Number(daily?.temperatureMax ?? NaN),
        low: Number(daily?.temperatureMin ?? NaN),
        code,
        description: getWeatherDescription(code),
      }
      setWeather(parsed)
      toast({ title: 'Weather updated', description: 'Latest conditions loaded.' })
    } catch (e: any) {
      setWeatherError(e?.message ?? 'Weather unavailable')
    } finally {
      setWeatherLoading(false)
    }
  }

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime((prevTime) => prevTime + 10)
      }, 10)
    }
    return () => clearInterval(interval)
  }, [isStopwatchRunning])

  function getWeatherDescription(code: number): string {
    const codes: Record<number, string> = {
      0: 'Unknown',
      1000: 'Clear',
      1001: 'Cloudy',
      1100: 'Mostly Clear',
      1101: 'Partly Cloudy',
      1102: 'Mostly Cloudy',
      2000: 'Fog',
      2100: 'Light Fog',
      3000: 'Light Wind',
      3001: 'Windy',
      3002: 'Strong Wind',
      4000: 'Drizzle',
      4001: 'Rain',
      4200: 'Light Rain',
      4201: 'Heavy Rain',
      5000: 'Snow',
      5001: 'Flurries',
      5100: 'Light Snow',
      5101: 'Heavy Snow',
      6000: 'Freezing Drizzle',
      6001: 'Freezing Rain',
      6200: 'Light Freezing Rain',
      6201: 'Heavy Freezing Rain',
      7000: 'Ice Pellets',
      7101: 'Heavy Ice Pellets',
      7102: 'Light Ice Pellets',
      8000: 'Thunderstorm',
    }
    return codes[code] ?? '—'
  }

  // Initial weather fetch
  useEffect(() => {
    loadWeather()
  }, [])

  // News
  type NewsItem = { id: string; title: string; url: string; source: string; publishedAt?: string }
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState<string | null>(null)

  async function loadNews() {
    setNewsLoading(true)
    setNewsError(null)
    try {
      const res = await fetch('/api/news')
      if (!res.ok) throw new Error('Failed to fetch news')
      const data = await res.json()
      const items: NewsItem[] = Array.isArray(data?.items) ? data.items : []
      setNews(items)
      toast({ title: 'News updated', description: 'Top headlines refreshed.' })
    } catch (e: any) {
      setNewsError(e?.message ?? 'News unavailable')
    } finally {
      setNewsLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  // Initial AI fun facts fetch
  useEffect(() => {
    loadFunFacts()
  }, [])

  // NASA APOD gallery
  type NasaItem = { id: string; title: string; url: string; hdurl?: string; date?: string; explanation?: string }
  const [nasa, setNasa] = useState<NasaItem[]>([])
  const [nasaLoading, setNasaLoading] = useState(true)
  const [nasaError, setNasaError] = useState<string | null>(null)
  const [nasaApi, setNasaApi] = useState<CarouselApi | null>(null)

  async function loadNasa() {
    setNasaLoading(true)
    setNasaError(null)
    try {
      const res = await fetch('/api/nasa?count=8')
      if (!res.ok) throw new Error('Failed to fetch NASA images')
      const data = await res.json()
      const items: NasaItem[] = Array.isArray(data?.items) ? data.items : []
      setNasa(items)
    } catch (e: any) {
      setNasaError(e?.message ?? 'NASA images unavailable')
    } finally {
      setNasaLoading(false)
    }
  }

  useEffect(() => {
    loadNasa()
  }, [])

  // Auto-rotate NASA carousel
  useEffect(() => {
    if (!nasaApi) return
    const id = setInterval(() => {
      try { nasaApi.scrollNext() } catch { }
    }, 5000)
    return () => clearInterval(id)
  }, [nasaApi])

  const startStopwatch = () => setIsStopwatchRunning(true)
  const pauseStopwatch = () => setIsStopwatchRunning(false)
  const resetStopwatch = () => {
    setStopwatchTime(0)
    setIsStopwatchRunning(false)
  }

  const formatStopwatchTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const centiseconds = Math.floor((time % 1000) / 10)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`
  }

  // Timer state and logic (15-minute intervals)
  const [timerBaseMs, setTimerBaseMs] = useState(15 * 60 * 1000)
  const [timerRemainingMs, setTimerRemainingMs] = useState(timerBaseMs)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    setTimerRemainingMs(timerBaseMs)
  }, [timerBaseMs])

  useEffect(() => {
    if (!isTimerRunning) return
    if (timerRemainingMs <= 0) {
      setIsTimerRunning(false)
      return
    }
    const id = setInterval(() => {
      setTimerRemainingMs((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isTimerRunning, timerRemainingMs])

  // Fire toast when countdown hits 0
  useEffect(() => {
    if (timerRemainingMs === 0) {
      toast({ title: 'Timer complete', description: 'Your countdown has finished.' })
    }
  }, [timerRemainingMs, toast])

  const formatTimer = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSendMessage = async () => {
    const input = chatInput.trim()
    if (!input || isChatLoading) return
    const userMessage = {
      id: chatMessages.length + 1,
      text: input,
      sender: "user" as const,
    }
    const assistantId = chatMessages.length + 2
    const assistantPlaceholder = { id: assistantId, text: "", sender: "bot" as const }
    setChatMessages((prev) => [...prev, userMessage, assistantPlaceholder])
    setChatInput("")
    setIsChatLoading(true)
    setChatError(null)

    try {
      const history = [...chatMessages, userMessage].map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))
      const controller = new AbortController()
      chatAbortRef.current = controller
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, stream: true }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error('Chat request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const evt of events) {
          const lines = evt.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const dataStr = trimmed.slice(5).trim()
            if (dataStr === '[DONE]') continue
            try {
              const json = JSON.parse(dataStr)
              const delta = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? ''
              if (delta) {
                setChatMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m)))
              }
            } catch {
              // ignore malformed sse chunk
            }
          }
        }
      }
    } catch (e: any) {
      setChatError(e?.message ?? 'Chat unavailable')
      setChatMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: 'Sorry, there was a problem contacting the computer core.' } : m)))
    } finally {
      chatAbortRef.current = null
      setIsChatLoading(false)
    }
  }

  const handleResetChat = () => {
    if (chatAbortRef.current) {
      try { chatAbortRef.current.abort() } catch { }
      chatAbortRef.current = null
    }
    setChatMessages([])
    setChatInput("")
    setChatError(null)
    setIsChatLoading(false)
  }

  const mockNews = [
    { id: 1, title: "Tech Innovation Summit Announced for 2025", category: "Technology" },
    { id: 2, title: "Climate Action Plan Shows Promising Results", category: "Environment" },
    { id: 3, title: "New Transportation Hub Opens Downtown", category: "Local" },
    { id: 4, title: "Healthcare Breakthrough in Gene Therapy", category: "Health" },
  ]

  return (
    <div className="relative min-h-screen bg-background p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wifi className="h-4 w-4 text-primary" />
          </div>
          <div>

            <div className="font-semibold">Noah's Pi</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadWeather} disabled={weatherLoading} className="gap-1">
            <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
            Weather
          </Button>
          <Button variant="secondary" size="sm" onClick={loadNews} disabled={newsLoading} className="gap-1">
            <RefreshCw className={`h-4 w-4 ${newsLoading ? 'animate-spin' : ''}`} />
            News
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Timer Widget */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Current Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-lg text-muted-foreground">
                  {currentTime.toLocaleDateString([], {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Widget */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Cloud className="h-5 w-5 text-primary" />
                Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">{weather ? `${Math.round(weather.temperature)}°F` : weatherLoading ? '—' : '—'}</div>
                  <div className="text-muted-foreground">{weather ? weather.description : weatherLoading ? 'Loading…' : (weatherError ?? '—')}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    Central Park, NY
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Thermometer className="h-3 w-3" />
                    <span>
                      H: {weather ? `${Math.round(weather.high)}°` : '—'} L: {weather ? `${Math.round(weather.low)}°` : '—'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Humidity: {weather ? `${Math.round(weather.humidity)}%` : '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stopwatch Widget */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Timer className="h-5 w-5 text-primary" />
                Stopwatch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stopwatch">
                <TabsList>
                  <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
                  <TabsTrigger value="timer">Timer</TabsTrigger>
                </TabsList>
                <TabsContent value="stopwatch">
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-mono font-bold text-primary">{formatStopwatchTime(stopwatchTime)}</div>
                    <div className="flex justify-center gap-2">
                      {!isStopwatchRunning ? (
                        <Button onClick={startStopwatch} className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Start
                        </Button>
                      ) : (
                        <Button onClick={pauseStopwatch} variant="secondary" className="flex items-center gap-2">
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                      )}
                      <Button onClick={resetStopwatch} variant="outline" className="flex items-center gap-2 bg-transparent">
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="timer">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="text-5xl font-mono font-bold text-primary">{formatTimer(timerRemainingMs)}</div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[15, 30, 45, 60].map((m) => (
                        <Button key={m} size="sm" variant={timerBaseMs === m * 60000 ? 'default' : 'secondary'} onClick={() => { setIsTimerRunning(false); setTimerBaseMs(m * 60000) }}>
                          {m}m
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-center gap-2">
                      {!isTimerRunning ? (
                        <Button onClick={() => setIsTimerRunning(true)} className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Start
                        </Button>
                      ) : (
                        <Button onClick={() => setIsTimerRunning(false)} variant="secondary" className="flex items-center gap-2">
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                      )}
                      <Button onClick={() => { setIsTimerRunning(false); setTimerRemainingMs(timerBaseMs) }} variant="outline" className="flex items-center gap-2 bg-transparent">
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - News */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Newspaper className="h-5 w-5 text-primary" />
              Top News Headlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 p-6">
                {newsLoading && (
                  <div className="space-y-3">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="h-5 w-2/3 bg-muted rounded" />
                  </div>
                )}
                {newsError && !newsLoading && (
                  <div className="text-sm text-destructive">{newsError}</div>
                )}
                {!newsLoading && !newsError && news.length === 0 && (
                  <div className="text-sm text-muted-foreground">No news available.</div>
                )}
                {!newsLoading && !newsError && news.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border/60"
                  >
                    <Badge variant="secondary" className="mb-2">
                      {item.source}
                    </Badge>
                    <h3 className="font-semibold text-card-foreground leading-tight">{item.title}</h3>
                    {item.publishedAt && (
                      <div className="text-xs text-muted-foreground mt-2">{new Date(item.publishedAt).toLocaleString()}</div>
                    )}
                  </a>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column - NASA Gallery */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <span className="inline-flex h-5 items-center rounded-md bg-primary/15 px-2 text-xs text-primary ring-1 ring-primary/20">NASA</span>
              Astronomy Picture of the Day
            </CardTitle>
            <CardAction>
              <Button variant="secondary" size="sm" onClick={loadNasa} disabled={nasaLoading} className="gap-1">
                <RefreshCw className={`h-4 w-4 ${nasaLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {nasaLoading && (
              <div className="h-[600px] w-full rounded-lg bg-muted animate-pulse" />
            )}
            {nasaError && !nasaLoading && (
              <div className="text-sm text-destructive">{nasaError}</div>
            )}
            {!nasaLoading && !nasaError && nasa.length > 0 && (
              <div className="relative">
                <Carousel setApi={setNasaApi} opts={{ loop: true }}>
                  <CarouselContent>
                    {nasa.map((item) => (
                      <CarouselItem key={item.id}>
                        <div className="relative h-[600px] w-full overflow-hidden rounded-lg border border-border">
                          <img src={item.hdurl || item.url} alt={item.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4">
                            <div className="text-sm text-muted-foreground">{item.date}</div>
                            <div className="font-semibold">{item.title}</div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-6" />
                  <CarouselNext className="-right-6" />
                </Carousel>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Far Right Column - AI Fun Facts */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Bot className="h-5 w-5 text-primary" />
              AI Generated Content
            </CardTitle>
            <CardAction>
              <Button variant="secondary" size="sm" onClick={loadFunFacts} disabled={funFactsLoading} className="gap-1">
                <RefreshCw className={`h-4 w-4 ${funFactsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="max-w-none p-4 pb-8 text-sm leading-6 break-words whitespace-pre-wrap">
                {funFactsLoading && (
                  <div className="space-y-3">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="h-5 w-2/3 bg-muted rounded" />
                  </div>
                )}
                {funFactsError && !funFactsLoading && (
                  <div className="text-sm text-destructive">{funFactsError}</div>
                )}
                {!funFactsLoading && !funFactsError && funFactsMd && (
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-base font-semibold mb-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-base font-semibold mb-2" {...props} />,
                      pre: ({ node, ...props }) => <pre className="whitespace-pre-wrap break-words mb-2" {...props} />,
                      code: ({ node, ...props }) => <code className="px-1 py-0.5 rounded bg-muted" {...props} />,
                    }}
                  >
                    {funFactsMd}
                  </ReactMarkdown>
                )}
                {!funFactsLoading && !funFactsError && !funFactsMd && (
                  <div className="text-sm text-muted-foreground">Press Refresh to get AI fun facts.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

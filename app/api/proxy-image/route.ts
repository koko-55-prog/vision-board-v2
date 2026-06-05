// Server-side image proxy — no CORS restrictions on the server side.
// Handles Pollinations queue-full (402) with automatic retry.

export const maxDuration = 30

const ALLOWED_HOSTS = ['image.pollinations.ai', 'images.pexels.com']
const MAX_RETRIES = 3
const RETRY_WAIT_MS = 15000  // Pollinations queue clears in ~15s

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) return new Response('Missing url parameter', { status: 400 })

  let hostname: string
  try { hostname = new URL(targetUrl).hostname } catch {
    return new Response('Invalid URL', { status: 400 })
  }
  if (!ALLOWED_HOSTS.includes(hostname)) {
    return new Response('Domain not allowed', { status: 403 })
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(targetUrl)

      if (res.ok) {
        const contentType = res.headers.get('content-type') ?? ''
        if (!contentType.startsWith('image/')) {
          return new Response('Not an image response', { status: 502 })
        }
        const data = await res.arrayBuffer()
        return new Response(data, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }

      if (res.status === 402) {
        // Pollinations queue full — wait and retry
        console.log(`Pollinations queue full (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${RETRY_WAIT_MS / 1000}s...`)
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_WAIT_MS))
          continue
        }
        return new Response('Pollinations queue full after retries', { status: 503 })
      }

      return new Response(`Upstream error: ${res.status}`, { status: 502 })
    } catch (err) {
      console.error('proxy-image error:', err)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 3000))
        continue
      }
      return new Response('Fetch failed', { status: 500 })
    }
  }

  return new Response('Max retries exceeded', { status: 503 })
}

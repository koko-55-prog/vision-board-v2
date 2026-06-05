// Server-side Pexels search + image fetch.
// API key stays on the server — never exposed to the client bundle.
// Vercel: add PEXELS_API_KEY to Environment Variables in the dashboard.

export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return new Response('Missing query', { status: 400 })

  // Support both the server-only key (preferred) and the legacy NEXT_PUBLIC_ key
  const apiKey = process.env.PEXELS_API_KEY ?? process.env.NEXT_PUBLIC_PEXELS_API_KEY
  if (!apiKey) return new Response('Pexels API key not configured', { status: 500 })

  // Search Pexels
  const searchRes = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
    { headers: { Authorization: apiKey } }
  )
  if (!searchRes.ok) {
    return new Response(`Pexels search error: ${searchRes.status}`, { status: 502 })
  }

  const data = await searchRes.json()
  if (!data.photos?.length) return new Response('No photos found', { status: 404 })

  // Pick a random photo from the top results
  const photo = data.photos[Math.floor(Math.random() * Math.min(8, data.photos.length))]
  const imageUrl = photo.src.medium || photo.src.small

  // Fetch the image binary and return it directly
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return new Response(`Image fetch error: ${imgRes.status}`, { status: 502 })

  const imageData = await imgRes.arrayBuffer()
  return new Response(imageData, {
    headers: {
      'Content-Type': imgRes.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

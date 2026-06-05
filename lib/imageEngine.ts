import { ImageSource } from './types'

export interface ImageResult {
  url: string
  source: ImageSource
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function compressToJpeg(src: string, maxW = 800, maxH = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = src
  })
}

// Fetch an external image via our Next.js server-side proxy (bypasses CORS)
async function fetchViaProxy(externalUrl: string, timeoutMs = 30000): Promise<string> {
  const res = await fetch(
    `/api/proxy-image?url=${encodeURIComponent(externalUrl)}`,
    { signal: AbortSignal.timeout(timeoutMs) }
  )
  if (!res.ok) throw new Error(`Proxy ${res.status}`)
  const blob = await res.blob()
  const raw = await blobToDataUrl(blob)
  return compressToJpeg(raw)
}

// ── Quality boost automatically appended to all AI prompts ────────────────────

const QUALITY_BOOST =
  'photorealistic, 8k resolution, cinematic lighting, highly aesthetic, masterpiece, professional photography'

// ── AI Image Generation ───────────────────────────────────────────────────────
// Calls app/api/generate-ai/route.ts (server-side).
// To switch AI provider, only that route file needs to change.

export async function fetchPollinationsImage(query: string): Promise<ImageResult> {
  const prompt = `${query}, ${QUALITY_BOOST}`

  const res = await fetch('/api/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(120000),  // 2 min — Replicate is fast (~10s), Horde is slow (~3min)
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`AI generation failed (${res.status}): ${msg.slice(0, 100)}`)
  }

  const blob = await res.blob()
  const raw = await blobToDataUrl(blob)
  return { url: await compressToJpeg(raw), source: 'pollinations' }
}

// ── Pexels Photo Search ───────────────────────────────────────────────────────

export async function fetchVisionImageReal(query: string): Promise<ImageResult> {
  const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
        { headers: { Authorization: apiKey } }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.photos?.length > 0) {
          const pick = data.photos[Math.floor(Math.random() * Math.min(8, data.photos.length))]
          try {
            return { url: await fetchViaProxy(pick.src.medium || pick.src.small), source: 'pexels' }
          } catch {
            return { url: pick.src.large || pick.src.medium, source: 'pexels' }
          }
        }
      }
    } catch { /* fall through to AI */ }
  }
  return fetchPollinationsImage(query)
}

// ── Image Upload ──────────────────────────────────────────────────────────────

export async function uploadImageFile(file: File): Promise<ImageResult> {
  const raw = await blobToDataUrl(file)
  return { url: await compressToJpeg(raw), source: 'upload' }
}

// Prototype mock (unused in production)
export async function fetchVisionImage(query: string): Promise<ImageResult> {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 700))
  const seed = query.replace(/[^\w]/g, '').slice(0, 28)
  return {
    url: `https://picsum.photos/seed/${seed}${Math.floor(Math.random() * 999)}/800/600`,
    source: 'mock',
  }
}

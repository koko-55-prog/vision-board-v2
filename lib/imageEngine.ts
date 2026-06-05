/**
 * Image Engine
 *
 * 外部API呼び出しはすべてサーバーサイドAPIルート経由。
 * クライアント側にAPIキーは一切露出しない。
 *
 * Pexels検索  → /api/search-pexels  (PEXELS_API_KEY)
 * AI生成      → /api/generate-ai    (REPLICATE_API_TOKEN など)
 * 画像プロキシ → /api/proxy-image   (CORS回避)
 */

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

// ── Quality boost appended to all AI prompts ──────────────────────────────────

const QUALITY_BOOST =
  'photorealistic, 8k resolution, cinematic lighting, highly aesthetic, masterpiece, professional photography'

// ── Pexels Photo Search (server-side route) ───────────────────────────────────

export async function fetchVisionImageReal(query: string): Promise<ImageResult> {
  try {
    const res = await fetch(
      `/api/search-pexels?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(30000) }
    )
    if (res.ok) {
      const blob = await res.blob()
      const raw = await blobToDataUrl(blob)
      return { url: await compressToJpeg(raw), source: 'pexels' }
    }
    if (res.status !== 404) console.warn('Pexels search error:', res.status)
  } catch (err) {
    console.warn('Pexels search failed:', err)
  }
  // Fall back to AI generation
  return fetchPollinationsImage(query)
}

// ── AI Image Generation (server-side route) ───────────────────────────────────
// Provider is configured in app/api/generate-ai/route.ts

export async function fetchPollinationsImage(query: string): Promise<ImageResult> {
  const prompt = `${query}, ${QUALITY_BOOST}`

  const res = await fetch('/api/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(120000),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`AI generation failed (${res.status}): ${msg.slice(0, 100)}`)
  }

  const blob = await res.blob()
  const raw = await blobToDataUrl(blob)
  return { url: await compressToJpeg(raw), source: 'pollinations' }
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

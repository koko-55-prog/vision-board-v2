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

function compressToJpeg(src: string, maxW = 800, maxH = 600, quality = 0.92): Promise<string> {
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

// canvas経由を避けてカラープロファイルを保持する。大きい場合のみ圧縮。
async function smartEncode(blob: Blob, skipThreshold = 400 * 1024): Promise<string> {
  const raw = await blobToDataUrl(blob)
  if (blob.size < skipThreshold) return raw
  return compressToJpeg(raw, 1200, 900, 0.92)
}

// ── Prompt style constants ────────────────────────────────────────────────────

const GENDER_PROMPTS = {
  male:
    "First-person POV from a man's perspective, reflecting a man's lifestyle and presence. " +
    'The AI should naturally decide the best framing for maximum immersion—whether that means ' +
    'capturing a pure breathtaking view, or subtly including masculine elements ' +
    '(like a sleeve, watch, or footwear) if it enhances the scene.',
  female:
    "First-person POV from a woman's perspective, reflecting a woman's lifestyle and aesthetics. " +
    'The AI should naturally decide the best framing for maximum immersion—whether that means ' +
    'capturing a pure breathtaking view, or subtly including feminine elements ' +
    '(like a soft sleeve, accessory, or footwear) if it enhances the scene.',
  unspecified:
    'Pure first-person POV scenery, focusing entirely on the beautiful environment without any human elements.',
}

function getGenderPrompt(): string {
  if (typeof window === 'undefined') return GENDER_PROMPTS.unspecified
  const gender = localStorage.getItem('vb:gender') ?? 'unspecified'
  return GENDER_PROMPTS[gender as keyof typeof GENDER_PROMPTS] ?? GENDER_PROMPTS.unspecified
}

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
      return { url: await smartEncode(blob), source: 'pexels' }
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
  const prompt = `${getGenderPrompt()}, ${query}, ${QUALITY_BOOST}`

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
  return { url: await smartEncode(blob), source: 'pollinations' }
}

// ── Image Upload ──────────────────────────────────────────────────────────────

export async function uploadImageFile(file: File): Promise<ImageResult> {
  return { url: await smartEncode(file, 800 * 1024), source: 'upload' }
}

// ── Face Photo Utils ──────────────────────────────────────────────────────────

// Resize to 480px max and compress for localStorage (target: ~30–60 KB base64)
export async function compressFaceForStorage(file: File): Promise<string> {
  const raw = await blobToDataUrl(file)
  return compressToJpeg(raw, 640, 640, 0.85)
}

// Face-preserving AI generation — client-side polling to avoid Vercel 60s timeout
export async function fetchFaceImage(query: string, faceBase64: string): Promise<ImageResult> {
  const prompt = `${getGenderPrompt()}, ${query}, ${QUALITY_BOOST}`

  // Step 1: Start prediction (returns {id} immediately)
  const startRes = await fetch('/api/generate-face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, face_image: faceBase64 }),
    signal: AbortSignal.timeout(30000),
  })
  if (!startRes.ok) {
    const msg = await startRes.text().catch(() => '')
    throw new Error(`Face AI generation failed (${startRes.status}): ${msg.slice(0, 100)}`)
  }
  const { id } = await startRes.json()

  // Step 2: Poll until done (max 3 minutes)
  const deadline = Date.now() + 3 * 60 * 1000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(`/api/poll-prediction?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!pollRes.ok) continue
    const data = await pollRes.json()

    if (data.status === 'succeeded' && data.url) {
      const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(data.url)}`)
      if (!imgRes.ok) throw new Error('Failed to fetch generated image')
      const blob = await imgRes.blob()
      const raw = await blobToDataUrl(blob)
      return { url: await compressToJpeg(raw), source: 'face-ai' }
    }
    if (data.status === 'failed') {
      throw new Error(`Face AI generation failed: ${data.error ?? 'unknown'}`)
    }
  }
  throw new Error('Face AI generation timed out')
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

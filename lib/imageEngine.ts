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

// ── Translation ───────────────────────────────────────────────────────────────

async function translateForPexels(query: string): Promise<string> {
  try {
    const system = 'You are a stock photo search expert. Convert the following Japanese text into 2-4 concise English keywords for searching stock photos. Focus on the most visual, concrete nouns and adjectives. Output ONLY the keywords separated by spaces. No punctuation, no commentary.'
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(query)}?system=${encodeURIComponent(system)}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const text = (await res.text()).trim()
      if (text) return text.slice(0, 80)
    }
  } catch { /* fall through */ }
  return query
}

async function translateToImagePrompt(query: string): Promise<string> {
  try {
    const system = 'You are a prompt engineer. Translate the following Japanese vision into a detailed, beautiful English image prompt for AI image generation. Output ONLY the English prompt text. No commentary, no quotes.'
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(query)}?system=${encodeURIComponent(system)}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (res.ok) {
      const text = (await res.text()).trim()
      if (text) return text
    }
  } catch { /* fall through */ }
  return query
}

// ── HuggingFace ───────────────────────────────────────────────────────────────

async function generateWithHuggingFace(prompt: string): Promise<string> {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN
  if (!token) throw new Error('NEXT_PUBLIC_HF_TOKEN is not set')

  const endpoint = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell'
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, parameters: { num_inference_steps: 4, width: 800, height: 600 } }),
      signal: AbortSignal.timeout(90000),
    })
    if (res.ok) return blobToDataUrl(await res.blob())
    if (res.status === 503) {
      const data = await res.json().catch(() => ({}))
      await new Promise(r => setTimeout(r, Math.min(((data.estimated_time ?? 20) + 5) * 1000, 35000)))
      continue
    }
    throw new Error(`HF error: ${res.status}`)
  }
  throw new Error('HF max retries exceeded')
}

// ── Public API ────────────────────────────────────────────────────────────────

// Upload from device — compress & convert to base64
export async function uploadImageFile(file: File): Promise<ImageResult> {
  const raw = await blobToDataUrl(file)
  const url = await compressToJpeg(raw)
  return { url, source: 'upload' }
}

// "AIで生成する" — HF FLUX → Pollinations fallback
export async function fetchPollinationsImage(query: string): Promise<ImageResult> {
  const englishPrompt = await translateToImagePrompt(query)
  const prompt = `${englishPrompt}, beautiful, aesthetic, dreamy, high quality, photorealistic`
  try {
    return { url: await generateWithHuggingFace(prompt), source: 'huggingface' }
  } catch (err) {
    console.warn('HF failed, falling back to Pollinations Flux:', err)
    const seed = Math.floor(Math.random() * 99999)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}&model=flux`
    await fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(60000) }).catch(() => {})
    return { url, source: 'pollinations' }
  }
}

// "Pexelsで写真を探す" — translate → Pexels → fetch+compress → HF fallback
export async function fetchVisionImageReal(query: string): Promise<ImageResult> {
  const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY
  if (apiKey) {
    const keywords = await translateForPexels(query)
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=15&orientation=landscape`,
        { headers: { Authorization: apiKey } }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.photos?.length > 0) {
          const pick = data.photos[Math.floor(Math.random() * Math.min(8, data.photos.length))]
          // Fetch medium size and compress to base64 (works offline + with html2canvas)
          try {
            const imgRes = await fetch(pick.src.medium || pick.src.small)
            const blob = await imgRes.blob()
            const raw = await blobToDataUrl(blob)
            const url = await compressToJpeg(raw)
            return { url, source: 'pexels' }
          } catch {
            return { url: pick.src.large || pick.src.medium, source: 'pexels' }
          }
        }
      }
    } catch { /* fall through */ }
  }
  return fetchPollinationsImage(query)
}

// Prototype mock
export async function fetchVisionImage(query: string): Promise<ImageResult> {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 700))
  const seed = query.replace(/[^\w]/g, '').slice(0, 28)
  return { url: `https://picsum.photos/seed/${seed}${Math.floor(Math.random() * 999)}/800/600`, source: 'mock' }
}

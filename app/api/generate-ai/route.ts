/**
 * AI Image Generation — Server-side Route
 *
 * プロバイダーを切り替えるには ACTIVE_PROVIDER を変更し、
 * 対応する generateWith*() 関数を追加するだけでOK。
 *
 * Current:  Stable Horde  (コミュニティGPU、完全無料、1〜3分)
 * Future:   HuggingFace   (api-inference.huggingface.co — 現在DNS blocked)
 *           Replicate      (replicate.com — 要APIキー)
 *           OpenAI DALL-E  (api.openai.com — 有料)
 */

type Provider = 'stable-horde' | 'huggingface'
const ACTIVE_PROVIDER: Provider = 'huggingface'

// ── Stable Horde ──────────────────────────────────────────────────────────────

const HORDE_KEY = '0000000000'  // anonymous key — no signup required

async function generateWithStableHorde(prompt: string): Promise<Response> {
  // 1. Submit job
  const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: { apikey: HORDE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt.slice(0, 500),
      params: {
        n: 1,
        width: 512,
        height: 512,
        steps: 20,
        cfg_scale: 7,
        sampler_name: 'k_euler',
      },
      models: ['stable_diffusion'],
      r2: false,  // return base64 directly in status response
    }),
  })

  if (!submitRes.ok) {
    const txt = await submitRes.text().catch(() => '')
    console.error('Horde submit failed:', submitRes.status, txt.slice(0, 200))
    return new Response(`Horde submit error: ${submitRes.status}`, { status: 502 })
  }

  const { id } = await submitRes.json()
  if (!id) return new Response('No job ID returned', { status: 502 })

  console.log(`Horde job submitted: ${id}`)

  // 2. Poll for completion (max 4 minutes)
  const deadline = Date.now() + 4 * 60 * 1000
  let pollCount = 0

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8000))
    pollCount++

    try {
      const statusRes = await fetch(
        `https://stablehorde.net/api/v2/generate/status/${id}`,
        { headers: { apikey: HORDE_KEY } }
      )
      if (!statusRes.ok) continue

      const status = await statusRes.json()
      console.log(`Horde poll #${pollCount}: done=${status.done}, wait=${status.wait_time}s`)

      if (status.done && status.generations?.length > 0) {
        const imgData: string = status.generations[0].img
        const base64 = imgData.includes(',') ? imgData.split(',')[1] : imgData
        const buffer = Buffer.from(base64, 'base64')
        console.log(`Horde generation complete after ${pollCount} polls`)
        return new Response(buffer, {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' },
        })
      }
    } catch (err) {
      console.warn('Horde poll error:', err)
    }
  }

  return new Response('Generation timed out after 4 minutes', { status: 504 })
}

// ── HuggingFace (currently DNS-blocked on this network) ───────────────────────

async function generateWithHuggingFace(prompt: string): Promise<Response> {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN
  if (!token) return new Response('HF token not set', { status: 500 })

  const models = [
    'black-forest-labs/FLUX.1-schnell',  // 最高品質・高速
    'runwayml/stable-diffusion-v1-5',    // フォールバック
    'stabilityai/stable-diffusion-2-1',  // フォールバック
  ]

  for (const model of models) {
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
      })
      if (res.ok) {
        const data = await res.arrayBuffer()
        return new Response(data, {
          headers: { 'Content-Type': res.headers.get('content-type') ?? 'image/jpeg' },
        })
      }
    } catch (err) {
      console.warn(`HF ${model} failed:`, err)
    }
  }
  return new Response('All HF models failed', { status: 502 })
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt: string = body.prompt ?? ''
  if (!prompt) return new Response('Missing prompt', { status: 400 })

  console.log(`[generate-ai] provider=${ACTIVE_PROVIDER}, prompt="${prompt.slice(0, 60)}..."`)

  switch (ACTIVE_PROVIDER) {
    case 'stable-horde':
      return generateWithStableHorde(prompt)
    case 'huggingface':
      return generateWithHuggingFace(prompt)
    default:
      return new Response('No active provider configured', { status: 503 })
  }
}

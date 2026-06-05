/**
 * AI Image Generation — Server-side Route
 *
 * プロバイダーを切り替えるには ACTIVE_PROVIDER を変更するだけ。
 *
 * Current:  replicate    (FLUX.2-pro、有料・高品質・数秒)
 * Options:  huggingface  (無料、ただし要DNS疎通)
 *           stable-horde (無料コミュニティGPU、1〜3分)
 */

type Provider = 'replicate' | 'huggingface' | 'stable-horde'
const ACTIVE_PROVIDER: Provider = 'replicate'

// output can be a string URL or an array of URLs depending on the model
function extractUrl(output: unknown): string {
  if (Array.isArray(output)) return String(output[0])
  return String(output ?? '')
}

// ── Replicate (FLUX.2-pro) ────────────────────────────────────────────────────

async function generateWithReplicate(prompt: string): Promise<Response> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return new Response('REPLICATE_API_TOKEN not set', { status: 500 })

  // Submit prediction — 'Prefer: wait' returns the result synchronously if done within 60s
  const createRes = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: '4:3',
          output_format: 'webp',
          output_quality: 85,
          safety_tolerance: 2,
        },
      }),
    }
  )

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => '')
    console.error('Replicate create failed:', createRes.status, txt.slice(0, 300))
    return new Response(`Replicate error ${createRes.status}`, { status: 502 })
  }

  const prediction = await createRes.json()
  console.log('Replicate prediction status:', prediction.status, prediction.id)

  // Result may already be available (if 'Prefer: wait' succeeded)
  if (prediction.status === 'succeeded') {
    return fetchAndReturn(extractUrl(prediction.output))
  }

  // Otherwise, poll until done (max 2 minutes)
  const id = prediction.id
  const deadline = Date.now() + 2 * 60 * 1000

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000))

    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!pollRes.ok) continue

    const result = await pollRes.json()
    console.log('Replicate poll:', result.status)

    if (result.status === 'succeeded') {
      return fetchAndReturn(extractUrl(result.output))
    }
    if (result.status === 'failed' || result.status === 'canceled') {
      return new Response(`Replicate ${result.status}: ${result.error ?? ''}`, { status: 502 })
    }
  }

  return new Response('Replicate: generation timed out', { status: 504 })
}

async function fetchAndReturn(imageUrl: string): Promise<Response> {
  if (!imageUrl) return new Response('No output URL', { status: 502 })
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) return new Response(`Image fetch failed: ${imgRes.status}`, { status: 502 })
  const data = await imgRes.arrayBuffer()
  return new Response(data, {
    headers: {
      'Content-Type': imgRes.headers.get('content-type') ?? 'image/webp',
      'Cache-Control': 'no-store',
    },
  })
}

// ── HuggingFace ───────────────────────────────────────────────────────────────

async function generateWithHuggingFace(prompt: string): Promise<Response> {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN
  if (!token) return new Response('HF token not set', { status: 500 })

  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'runwayml/stable-diffusion-v1-5',
    'stabilityai/stable-diffusion-2-1',
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
      console.warn(`HF ${model}: HTTP ${res.status}`)
    } catch (err) {
      console.warn(`HF ${model} error:`, err)
    }
  }
  return new Response('All HF models failed', { status: 502 })
}

// ── Stable Horde (free community GPU) ────────────────────────────────────────

const HORDE_KEY = '0000000000'

async function generateWithStableHorde(prompt: string): Promise<Response> {
  const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: { apikey: HORDE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt.slice(0, 500),
      params: { n: 1, width: 512, height: 512, steps: 20, cfg_scale: 7, sampler_name: 'k_euler' },
      models: ['stable_diffusion'],
      r2: false,
    }),
  })
  if (!submitRes.ok) return new Response(`Horde submit ${submitRes.status}`, { status: 502 })

  const { id } = await submitRes.json()
  const deadline = Date.now() + 4 * 60 * 1000

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8000))
    try {
      const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
        headers: { apikey: HORDE_KEY },
      })
      if (!statusRes.ok) continue
      const status = await statusRes.json()
      if (status.done && status.generations?.length > 0) {
        const imgData: string = status.generations[0].img
        const base64 = imgData.includes(',') ? imgData.split(',')[1] : imgData
        return new Response(Buffer.from(base64, 'base64'), {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' },
        })
      }
    } catch { /* keep polling */ }
  }
  return new Response('Stable Horde timeout', { status: 504 })
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt: string = body.prompt ?? ''
  if (!prompt) return new Response('Missing prompt', { status: 400 })

  console.log(`[generate-ai] provider=${ACTIVE_PROVIDER}, prompt="${prompt.slice(0, 60)}..."`)

  switch (ACTIVE_PROVIDER) {
    case 'replicate':    return generateWithReplicate(prompt)
    case 'huggingface':  return generateWithHuggingFace(prompt)
    case 'stable-horde': return generateWithStableHorde(prompt)
    default:             return new Response('No provider configured', { status: 503 })
  }
}

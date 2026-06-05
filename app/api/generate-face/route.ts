/**
 * Face-to-Image Generation — Server-side Route
 * Model: zsxkib/pulid-flux (FLUX.1-dev + PuLID face preservation)
 * Falls back to text-only Flux Pro if no face_image is provided.
 */

export const maxDuration = 60

function extractUrl(output: unknown): string {
  if (Array.isArray(output)) return String(output[0])
  return String(output ?? '')
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

async function pollUntilDone(token: string, id: string): Promise<Response> {
  const deadline = Date.now() + 2 * 60 * 1000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!pollRes.ok) continue
    const result = await pollRes.json()
    console.log('Face poll:', result.status)
    if (result.status === 'succeeded') return fetchAndReturn(extractUrl(result.output))
    if (result.status === 'failed' || result.status === 'canceled') {
      return new Response(`Replicate ${result.status}: ${result.error ?? ''}`, { status: 502 })
    }
  }
  return new Response('Face generation timed out', { status: 504 })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt: string = body.prompt ?? ''
  const faceImage: string = body.face_image ?? ''

  if (!prompt) return new Response('Missing prompt', { status: 400 })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return new Response('REPLICATE_API_TOKEN not set', { status: 500 })

  console.log(`[generate-face] prompt="${prompt.slice(0, 60)}..." face=${!!faceImage}`)

  const createRes = await fetch(
    'https://api.replicate.com/v1/models/zsxkib/pulid-flux/predictions',
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
          main_face_image: faceImage,
          num_steps: 20,
          start_step: 4,
          guidance_scale: 4,
          true_cfg: 1,
          width: 896,
          height: 1152,
        },
      }),
    }
  )

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => '')
    console.error('PuLID-Flux create failed:', createRes.status, txt.slice(0, 300))
    return new Response(`Replicate error ${createRes.status}`, { status: 502 })
  }

  const prediction = await createRes.json()
  console.log('PuLID-Flux prediction status:', prediction.status, prediction.id)

  if (prediction.status === 'succeeded') return fetchAndReturn(extractUrl(prediction.output))
  return pollUntilDone(token, prediction.id)
}

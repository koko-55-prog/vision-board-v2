/**
 * Face-to-Image Generation — Server-side Route
 * Model: zsxkib/instant-id (InstantID + SDXL, face preservation)
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
    'https://api.replicate.com/v1/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        version: '2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789',
        input: {
          image: faceImage,
          prompt,
          negative_prompt: 'deformed, distorted, disfigured, blurry, ugly, bad anatomy',
          num_outputs: 1,
          guidance_scale: 5,
          num_inference_steps: 30,
          ip_adapter_scale: 0.8,
          controlnet_conditioning_scale: 0.8,
        },
      }),
    }
  )

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => '')
    console.error('InstantID create failed:', createRes.status, txt.slice(0, 300))
    return new Response(`Replicate error ${createRes.status}`, { status: 502 })
  }

  const prediction = await createRes.json()
  console.log('InstantID prediction status:', prediction.status, prediction.id)

  if (prediction.status === 'succeeded') return fetchAndReturn(extractUrl(prediction.output))
  return pollUntilDone(token, prediction.id)
}

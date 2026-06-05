/**
 * Face-to-Image Generation — Start prediction only, return {id} immediately.
 * Client polls /api/poll-prediction?id=xxx until done.
 * This keeps each Vercel function call well under the 60s limit.
 */

export const maxDuration = 30

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt: string = body.prompt ?? ''
  const faceImage: string = body.face_image ?? ''

  if (!prompt) return new Response('Missing prompt', { status: 400 })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return new Response('REPLICATE_API_TOKEN not set', { status: 500 })

  console.log(`[generate-face] starting prediction, prompt="${prompt.slice(0, 60)}..."`)

  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '2e4785a4d80dadf580077b2244c8d7c05d8e3faac04a04c02d8e099dd2876789',
      input: {
        image: faceImage,
        prompt,
        negative_prompt: 'deformed, distorted, disfigured, blurry, ugly, bad anatomy, extra fingers, mutation, poorly drawn face',
        num_outputs: 1,
        sdxl_weights: 'RealVisXL_V4.0_Lightning',
        guidance_scale: 7.5,
        num_inference_steps: 40,
        ip_adapter_scale: 1.0,
        controlnet_conditioning_scale: 1.1,
        enhance_nonface_region: true,
      },
    }),
  })

  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => '')
    console.error('InstantID create failed:', createRes.status, txt.slice(0, 300))
    return new Response(`Replicate error ${createRes.status}`, { status: 502 })
  }

  const prediction = await createRes.json()
  console.log('[generate-face] prediction created:', prediction.id)
  return Response.json({ id: prediction.id })
}

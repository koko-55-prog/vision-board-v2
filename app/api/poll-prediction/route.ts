// Poll a Replicate prediction by ID. Returns { status, url?, error? }.

export const maxDuration = 10

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')?.trim()

  if (!id || !/^[a-z0-9]{20,}$/i.test(id)) {
    return new Response('Invalid prediction id', { status: 400 })
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return new Response('REPLICATE_API_TOKEN not set', { status: 500 })

  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return new Response(`Replicate poll failed: ${res.status}`, { status: 502 })

  const prediction = await res.json()
  const { status, output, error } = prediction

  if (status === 'succeeded') {
    const url = Array.isArray(output) ? String(output[0]) : String(output ?? '')
    return Response.json({ status: 'succeeded', url })
  }
  if (status === 'failed' || status === 'canceled') {
    return Response.json({ status: 'failed', error: error ?? 'unknown error' })
  }

  return Response.json({ status })
}

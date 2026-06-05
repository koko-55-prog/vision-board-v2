// Verifies the unlock passphrase server-side so it never appears in the client bundle.
// Change AI_PASSPHRASE / MONITOR_PASSPHRASE in .env.local to update each passphrase.

export async function POST(request: Request) {
  const { passphrase } = await request.json().catch(() => ({ passphrase: '' }))
  const ownerSecret  = process.env.AI_PASSPHRASE      ?? 'enjoyfication'
  const monitorSecret = process.env.MONITOR_PASSPHRASE ?? 'vb-moni'

  if (passphrase === ownerSecret)  return Response.json({ valid: true,  type: 'owner' })
  if (passphrase === monitorSecret) return Response.json({ valid: true,  type: 'monitor' })
  return Response.json({ valid: false })
}

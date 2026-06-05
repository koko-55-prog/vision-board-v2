// Verifies the unlock passphrase server-side so it never appears in the client bundle.
// Change AI_PASSPHRASE in .env.local to update the passphrase.

export async function POST(request: Request) {
  const { passphrase } = await request.json().catch(() => ({ passphrase: '' }))
  const secret = process.env.AI_PASSPHRASE ?? 'enjoyfication'
  return Response.json({ valid: passphrase === secret })
}

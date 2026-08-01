export default defineEventHandler(async (event) => {
  const { project_id, target_type, target_id, amount, date } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ project_id, target_type, target_id, amount: Number(amount), date })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to record payment' })
  }

  const result = await response.json()
  return result[0]
})

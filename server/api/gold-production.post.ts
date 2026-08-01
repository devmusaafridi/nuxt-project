export default defineEventHandler(async (event) => {
  const { project_id, grams, date } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/gold_production`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ project_id, grams: Number(grams), date })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to record gold production' })
  }

  const result = await response.json()
  return result[0]
})

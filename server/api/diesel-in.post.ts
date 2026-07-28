export default defineEventHandler(async (event) => {
  const { project_id, litres, price_per_litre, date, slip_image_url } = await readBody(event)

  if (!project_id || !litres || !price_per_litre || !date) {
    throw createError({ statusCode: 400, message: 'Litres, price per litre and date are required' })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/diesel_in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ project_id, litres, price_per_litre, date, slip_image_url })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to record diesel in' })
  }

  const result = await response.json()
  return result[0]
})

export default defineEventHandler(async (event) => {
  const { project_id, owner_name, owner_mobile_number, picture_url, hourly_rate } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/excavators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ project_id, owner_name, owner_mobile_number, picture_url, hourly_rate: Number(hourly_rate) || 0 })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to create excavator' })
  }

  const result = await response.json()
  return result[0]
})

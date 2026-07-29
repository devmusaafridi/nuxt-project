export default defineEventHandler(async (event) => {
  const { project_id, type, cost, description, date } = await readBody(event)

  if (!project_id || !type || !cost || !date) {
    throw createError({ statusCode: 400, message: 'Maintenance type, cost and date are required' })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ project_id, type, cost, description: description || null, date })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to record maintenance' })
  }

  const result = await response.json()
  return result[0]
})

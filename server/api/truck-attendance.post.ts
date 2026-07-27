export default defineEventHandler(async (event) => {
  const { truck_id, date, present } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/truck_attendance?on_conflict=truck_id,date`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({ truck_id, date, present })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to save truck attendance' })
  }

  const result = await response.json()
  return result[0]
})

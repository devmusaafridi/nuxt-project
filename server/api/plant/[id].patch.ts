export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { name, hourly_rate } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const payload: any = { name }
  if (hourly_rate !== undefined) payload.hourly_rate = Number(hourly_rate) || 0

  const response = await fetch(`${supabaseUrl}/rest/v1/plants?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to update plant' })
  }

  return { success: true }
})

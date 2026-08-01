export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { owner_name, owner_mobile_number, picture_url, hourly_rate } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const payload: any = { owner_name, owner_mobile_number }
  if (picture_url !== undefined) payload.picture_url = picture_url
  if (hourly_rate !== undefined) payload.hourly_rate = Number(hourly_rate) || 0

  const response = await fetch(`${supabaseUrl}/rest/v1/excavators?id=eq.${id}`, {
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
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to update excavator' })
  }

  return { success: true }
})

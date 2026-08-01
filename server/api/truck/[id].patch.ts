export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { owner_name, owner_mobile_number, picture_url, monthly_salary } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const payload: any = { owner_name, owner_mobile_number }
  if (picture_url !== undefined) payload.picture_url = picture_url
  if (monthly_salary !== undefined) payload.monthly_salary = Number(monthly_salary) || 0

  const response = await fetch(`${supabaseUrl}/rest/v1/trucks?id=eq.${id}`, {
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
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to update truck' })
  }

  return { success: true }
})

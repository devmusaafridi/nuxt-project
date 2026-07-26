export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { name, capital_allocated, assigned_user } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const payload: any = { name, capital_allocated: Number(capital_allocated) }
  payload.assigned_user = assigned_user || null

  const response = await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${id}`, {
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
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to update project' })
  }

  return { success: true }
})

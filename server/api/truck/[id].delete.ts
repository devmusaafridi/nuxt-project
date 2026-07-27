export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/trucks?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to delete truck' })
  }

  return { success: true }
})

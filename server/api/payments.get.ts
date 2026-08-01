export default defineEventHandler(async (event) => {
  const { projectId, targetType, targetId } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  let url = `${supabaseUrl}/rest/v1/payments?project_id=eq.${projectId}`
  if (targetType) url += `&target_type=eq.${targetType}`
  if (targetId) url += `&target_id=eq.${targetId}`
  url += '&order=date.desc'

  const response = await fetch(url, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch payments' })
  }

  return response.json()
})

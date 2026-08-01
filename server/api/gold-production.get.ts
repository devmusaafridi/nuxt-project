export default defineEventHandler(async (event) => {
  const { projectId } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/gold_production?project_id=eq.${projectId}&order=date.desc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch gold production' })
  }

  return response.json()
})

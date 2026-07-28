export default defineEventHandler(async (event) => {
  const { projectId } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/diesel_in?project_id=eq.${projectId}&order=date.desc,created_at.desc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch diesel in records' })
  }

  return response.json()
})

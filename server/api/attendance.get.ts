export default defineEventHandler(async (event) => {
  const { projectId, date } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/worker_attendance?select=id,worker_id,date,status,workers!inner(project_id)&workers.project_id=eq.${projectId}&date=eq.${date}`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch attendance' })
  }

  return response.json()
})

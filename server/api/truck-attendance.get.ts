export default defineEventHandler(async (event) => {
  const { projectId, date } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/truck_attendance?select=id,truck_id,date,present,trucks!inner(project_id)&trucks.project_id=eq.${projectId}&date=eq.${date}`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch truck attendance' })
  }

  return response.json()
})

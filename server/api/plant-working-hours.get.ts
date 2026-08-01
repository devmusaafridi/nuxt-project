export default defineEventHandler(async (event) => {
  const { projectId, date } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const dateFilter = date ? `&date=eq.${date}` : ''

  const response = await fetch(
    `${supabaseUrl}/rest/v1/plant_working_hours?select=id,plant_id,date,start_time,end_time,plants!inner(project_id)&plants.project_id=eq.${projectId}${dateFilter}&order=start_time.asc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch plant working hours' })
  }

  const rows = await response.json()
  return rows.map((r: any) => ({ ...r, plants: undefined }))
})

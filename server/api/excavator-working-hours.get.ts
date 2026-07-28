export default defineEventHandler(async (event) => {
  const { projectId, date } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/excavator_working_hours?select=id,excavator_id,date,start_time,end_time,excavators!inner(project_id)&excavators.project_id=eq.${projectId}&date=eq.${date}&order=start_time.asc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch excavator working hours' })
  }

  const rows = await response.json()
  return rows.map((r: any) => ({ ...r, excavators: undefined }))
})

export default defineEventHandler(async (event) => {
  const { projectId, date } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/excavator_working_hours?select=id,excavator_id,date,start_time,end_time,excavators!inner(project_id)&excavators.project_id=eq.${projectId}&date=eq.${date}&order=start_time.asc`,
    { headers }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch excavator working hours' })
  }

  const rows = (await response.json()).map((r: any) => ({ ...r, excavators: undefined }))
  if (rows.length === 0) return rows

  // Sessions don't record who was driving — reconstruct it from driver history
  // so replacing a driver today doesn't rewrite past sessions' driver label.
  const excavatorIds = [...new Set(rows.map((r: any) => r.excavator_id))]
  const driversResponse = await fetch(
    `${supabaseUrl}/rest/v1/excavator_drivers?excavator_id=in.(${excavatorIds.join(',')})&select=excavator_id,driver_name,created_at`,
    { headers }
  )
  const drivers = driversResponse.ok ? await driversResponse.json() : []

  return rows.map((r: any) => {
    const driversForExcavator = drivers.filter((d: any) => d.excavator_id === r.excavator_id)
    const driver = pickDriverAsOf(driversForExcavator, r.date)
    return { ...r, driver_name: driver?.driver_name || null }
  })
})

export default defineEventHandler(async (event) => {
  const { projectId, date } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/truck_attendance?select=id,truck_id,date,present,trucks!inner(project_id)&trucks.project_id=eq.${projectId}&date=eq.${date}`,
    { headers }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch truck attendance' })
  }

  const rows = (await response.json()).map((r: any) => ({ ...r, trucks: undefined }))
  if (rows.length === 0) return rows

  // Attendance rows don't record who was driving — reconstruct it from driver
  // history so replacing a driver today doesn't rewrite past attendance labels.
  const truckIds = [...new Set(rows.map((r: any) => r.truck_id))]
  const driversResponse = await fetch(
    `${supabaseUrl}/rest/v1/truck_drivers?truck_id=in.(${truckIds.join(',')})&select=truck_id,driver_name,created_at`,
    { headers }
  )
  const drivers = driversResponse.ok ? await driversResponse.json() : []

  return rows.map((r: any) => {
    const driversForTruck = drivers.filter((d: any) => d.truck_id === r.truck_id)
    const driver = pickDriverAsOf(driversForTruck, r.date)
    return { ...r, driver_name: driver?.driver_name || null }
  })
})

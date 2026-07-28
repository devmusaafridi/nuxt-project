export default defineEventHandler(async (event) => {
  const { projectId } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/diesel_out?project_id=eq.${projectId}&order=date.desc,created_at.desc`,
    { headers }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch diesel out records' })
  }

  const rows = await response.json()
  if (rows.length === 0) return rows

  // target_id points at a truck/excavator row with no FK/join available (target_type
  // varies), so resolve display names separately rather than via an embedded select.
  const [trucksResponse, excavatorsResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/trucks?project_id=eq.${projectId}&select=id,owner_name`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/excavators?project_id=eq.${projectId}&select=id,owner_name`, { headers })
  ])
  const trucks = trucksResponse.ok ? await trucksResponse.json() : []
  const excavators = excavatorsResponse.ok ? await excavatorsResponse.json() : []
  const truckNames = Object.fromEntries(trucks.map((t: any) => [t.id, t.owner_name]))
  const excavatorNames = Object.fromEntries(excavators.map((e: any) => [e.id, e.owner_name]))

  return rows.map((r: any) => {
    let target_name = 'Generator'
    if (r.target_type === 'truck') target_name = truckNames[r.target_id] || 'Unknown Truck'
    if (r.target_type === 'excavator') target_name = excavatorNames[r.target_id] || 'Unknown Excavator'
    return { ...r, target_name }
  })
})

export default defineEventHandler(async (event) => {
  const { projectId } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/excavators?select=*,excavator_drivers(id,driver_name,picture_url,cnic_picture_url,mobile_number,is_active)&excavator_drivers.is_active=eq.true&project_id=eq.${projectId}&order=created_at.desc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch excavators' })
  }

  const excavators = await response.json()
  return excavators.map((e: any) => ({ ...e, driver: e.excavator_drivers?.[0] || null, excavator_drivers: undefined }))
})

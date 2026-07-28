export default defineEventHandler(async (event) => {
  const { truck_id } = getQuery(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(
    `${supabaseUrl}/rest/v1/truck_drivers?truck_id=eq.${truck_id}&select=id,driver_name,picture_url,cnic_picture_url,mobile_number,is_active,created_at&order=created_at.desc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || 'Failed to fetch truck driver history' })
  }

  return await response.json()
})

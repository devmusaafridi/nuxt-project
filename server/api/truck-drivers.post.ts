export default defineEventHandler(async (event) => {
  const { truck_id, driver_name, picture_url, cnic_picture_url, mobile_number } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`
  }

  // Retire the current active driver, if any — history is kept for the truck.
  const deactivateResponse = await fetch(
    `${supabaseUrl}/rest/v1/truck_drivers?truck_id=eq.${truck_id}&is_active=eq.true`,
    { method: 'PATCH', headers, body: JSON.stringify({ is_active: false }) }
  )

  if (!deactivateResponse.ok) {
    const err = await deactivateResponse.json().catch(() => ({}))
    throw createError({ statusCode: deactivateResponse.status, message: err?.message || 'Failed to retire previous driver' })
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/truck_drivers`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({ truck_id, driver_name, picture_url, cnic_picture_url, mobile_number, is_active: true })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to assign driver' })
  }

  const result = await response.json()
  return result[0]
})

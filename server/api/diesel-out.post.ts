export default defineEventHandler(async (event) => {
  const { project_id, target_type, target_id, litres, date } = await readBody(event)

  if (!['truck', 'excavator', 'generator'].includes(target_type)) {
    throw createError({ statusCode: 400, message: 'Invalid consumption source' })
  }
  if (target_type !== 'generator' && !target_id) {
    throw createError({ statusCode: 400, message: 'Please select which truck/excavator consumed the diesel' })
  }
  if (!project_id || !litres || !date) {
    throw createError({ statusCode: 400, message: 'Litres and date are required' })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/diesel_out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      project_id,
      target_type,
      target_id: target_type === 'generator' ? null : target_id,
      litres,
      date
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to record diesel consumption' })
  }

  const result = await response.json()
  return result[0]
})

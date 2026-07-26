export default defineEventHandler(async (event) => {
  const { name, capital_allocated, assigned_user } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const payload: any = { name, capital_allocated: Number(capital_allocated) }
  if (assigned_user) payload.assigned_user = assigned_user

  const response = await fetch(`${supabaseUrl}/rest/v1/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to create project' })
  }

  const result = await response.json()
  return result[0]
})

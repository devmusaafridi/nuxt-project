export default defineEventHandler(async (event) => {
  const { project_id, type, amount, description, date } = await readBody(event)

  if (!project_id || !type || !amount || !date) {
    throw createError({ statusCode: 400, message: 'Expense type, amount and date are required' })
  }

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/other_expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ project_id, type, amount, description: description || null, date })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw createError({ statusCode: response.status, message: err?.message || err?.details || 'Failed to record expense' })
  }

  const result = await response.json()
  return result[0]
})

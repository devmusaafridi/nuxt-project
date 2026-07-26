export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { username, role, password } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  // Update profile (username + role)
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ username, role })
  })

  if (!profileRes.ok) {
    const err = await profileRes.json().catch(() => ({}))
    throw createError({ statusCode: profileRes.status, message: err?.message || 'Failed to update profile' })
  }

  // Update password in auth if provided
  if (password) {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ password })
    })

    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}))
      throw createError({ statusCode: authRes.status, message: err?.message || 'Failed to update password' })
    }
  }

  return { success: true }
})

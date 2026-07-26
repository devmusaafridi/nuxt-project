export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  // Delete from auth (cascades to profile if FK is set, otherwise delete profile first)
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  })

  if (!profileRes.ok) {
    const err = await profileRes.json().catch(() => ({}))
    throw createError({ statusCode: profileRes.status, message: err?.message || 'Failed to delete profile' })
  }

  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  })

  if (!authRes.ok) {
    const err = await authRes.json().catch(() => ({}))
    throw createError({ statusCode: authRes.status, message: err?.message || 'Failed to delete auth user' })
  }

  return { success: true }
})

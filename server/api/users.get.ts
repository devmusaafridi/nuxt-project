export default defineEventHandler(async () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const [profilesRes, authRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/profiles?role=neq.super_admin&order=created_at.desc`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    }),
    fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    })
  ])

  if (!profilesRes.ok) {
    const err = await profilesRes.json().catch(() => ({}))
    throw createError({ statusCode: profilesRes.status, message: err?.message || 'Failed to fetch profiles' })
  }
  if (!authRes.ok) {
    const err = await authRes.json().catch(() => ({}))
    throw createError({ statusCode: authRes.status, message: err?.message || 'Failed to fetch auth users' })
  }

  const profiles = await profilesRes.json()
  const { users: authUsers } = await authRes.json()

  const emailMap = Object.fromEntries((authUsers || []).map((u: any) => [u.id, u.email]))

  return profiles.map((p: any) => ({ ...p, email: emailMap[p.id] || '' }))
})

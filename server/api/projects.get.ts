export default defineEventHandler(async () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const [projectsRes, profilesRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/projects?order=created_at.desc`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    }),
    fetch(`${supabaseUrl}/rest/v1/profiles?select=id,username`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    })
  ])

  if (!projectsRes.ok) {
    const err = await projectsRes.json().catch(() => ({}))
    throw createError({ statusCode: projectsRes.status, message: err?.message || 'Failed to fetch projects' })
  }

  const projects = await projectsRes.json()
  const profiles = profilesRes.ok ? await profilesRes.json() : []

  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.username]))

  return projects.map((p: any) => ({
    ...p,
    assigned_user: p.assigned_user
      ? { id: p.assigned_user, username: profileMap[p.assigned_user] || 'Unknown' }
      : null
  }))
})

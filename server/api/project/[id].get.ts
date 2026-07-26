export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  const [projectRes, profilesRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${id}&limit=1`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    }),
    fetch(`${supabaseUrl}/rest/v1/profiles?select=id,username`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    })
  ])

  if (!projectRes.ok) {
    const err = await projectRes.json().catch(() => ({}))
    throw createError({ statusCode: projectRes.status, message: err?.message || 'Failed to fetch project' })
  }

  const projects = await projectRes.json()
  if (!projects.length) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  const profiles = profilesRes.ok ? await profilesRes.json() : []
  const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.username]))

  const project = projects[0]
  return {
    ...project,
    assigned_user: project.assigned_user
      ? { id: project.assigned_user, username: profileMap[project.assigned_user] || 'Unknown' }
      : null
  }
})

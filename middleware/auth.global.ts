export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const { profile, fetchProfile } = useAuth()

  // If user is logged in but profile is not loaded, fetch it
  if (user.value && !profile.value) {
    await fetchProfile()
  }

  // Redirect to login if not authenticated
  if (!user.value && to.path !== '/') {
    return navigateTo('/')
  }

  // Role-based redirection
  if (user.value && profile.value) {
    if (to.path === '/') {
      if (profile.value.role === 'super_admin') return navigateTo('/admin')
      if (profile.value.role === 'user') return navigateTo('/user/dashboard')
      if (profile.value.role === 'visitor') return navigateTo('/visitor')
    }

    // Protect admin routes
    if (to.path.startsWith('/admin') && profile.value.role !== 'super_admin') {
      return navigateTo('/')
    }

    // Protect user routes
    if (to.path.startsWith('/user') && profile.value.role !== 'user') {
      return navigateTo('/')
    }

    // Protect visitor routes
    if (to.path.startsWith('/visitor') && profile.value.role !== 'visitor') {
      return navigateTo('/')
    }
  }
})

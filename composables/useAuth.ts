export const useAuth = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useState('profile', () => null)

  const fetchProfile = async (userId?: string) => {
    const id = userId ?? user.value?.id
    if (!id) {
      profile.value = null
      return
    }

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return
    }

    profile.value = data
  }

  const login = async (email, password) => {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    await fetchProfile(data.user?.id)
    return data
  }

  const logout = async () => {
    const { error } = await client.auth.signOut()
    if (error) throw error
    profile.value = null
    navigateTo('/')
  }

  return {
    user,
    profile,
    fetchProfile,
    login,
    logout,
  }
}

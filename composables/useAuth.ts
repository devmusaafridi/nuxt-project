export const useAuth = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useState('profile', () => null)

  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null
      return
    }

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
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
    await fetchProfile()
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

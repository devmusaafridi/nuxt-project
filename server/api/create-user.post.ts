export default defineEventHandler(async (event) => {
  const { email, password, username, role } = await readBody(event)

  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  // Step 1: Create the auth user
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role }
    })
  })

  const authResult = await authResponse.json()

  if (!authResponse.ok) {
    throw createError({
      statusCode: authResponse.status,
      message: authResult?.msg || authResult?.message || authResult?.error_description || authResult?.error || JSON.stringify(authResult)
    })
  }

  // Step 2: Insert into profiles directly
  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      id: authResult.id,
      username,
      role
    })
  })

  if (!profileResponse.ok) {
    const profileError = await profileResponse.json().catch(() => ({}))
    console.error('[create-user] profile insert failed:', JSON.stringify(profileError))

    // Ignore duplicate key (trigger already inserted it)
    if (profileError?.code !== '23505') {
      throw createError({
        statusCode: 500,
        message: `Profile insert failed: ${profileError?.message || profileError?.details || JSON.stringify(profileError)}`
      })
    }
  }

  return { user: authResult }
})
